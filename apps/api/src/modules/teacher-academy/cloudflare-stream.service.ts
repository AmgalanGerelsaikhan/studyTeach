import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { PlaybackToken } from '@studyteach/contracts';
import { importPKCS8, SignJWT } from 'jose';

import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

// The RSA signing key as jose returns it (a `KeyLike` in jose v5) — aliased
// so the runtime key type never has to be named explicitly.
type SigningKey = Awaited<ReturnType<typeof importPKCS8>>;

/**
 * Mints signed Cloudflare Stream playback tokens for Teacher Academy lessons
 * (E-025, PRD §4.5).
 *
 * Cloudflare Stream's "signed URL" feature gates a video behind a short-lived
 * JWT. The token is an RS256 JWT whose:
 *   - header  carries { alg: 'RS256', kid } — kid = the signing key ID minted
 *     via the Stream `/keys` API.
 *   - payload carries { sub, kid, exp, nbf } — sub = the video UID.
 * It is signed with the RSA private key (PEM/PKCS8) returned alongside the
 * key ID. The signed token is then substituted for the bare video UID in the
 * delivery URL: https://videodelivery.net/<token>/manifest/video.m3u8
 *
 * Playback is server-mediated: the client never sees the signing key, only the
 * minted, expiring token. If the signing env is unset (dev), this throws a
 * clear ServiceUnavailableException so the lesson player degrades to the
 * transcript instead of failing opaquely.
 */
@Injectable()
export class CloudflareStreamService {
  private readonly log = new Logger('CloudflareStreamService');
  /** Token lifetime — long enough for one lesson sitting, short enough to expire. */
  private static readonly TOKEN_TTL_SECONDS = 3600;
  private signingKey: SigningKey | null = null;

  constructor(
    private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Mints a signed playback grant for one lesson.
   * - lesson missing            → NotFoundException
   * - lesson has no video_uid   → NotFoundException (transcript-only lesson)
   * - signing env not configured → ServiceUnavailableException (dev: UI falls
   *   back to the transcript)
   */
  async mintPlaybackToken(lessonId: number): Promise<PlaybackToken> {
    const { rows } = await this.db.query<{ video_uid: string | null }>(
      `SELECT video_uid FROM academy_lessons WHERE lesson_id = $1`,
      [lessonId],
    );
    const lesson = rows[0];
    if (!lesson) throw new NotFoundException('lesson not found');
    if (!lesson.video_uid) {
      throw new NotFoundException('lesson has no video — use the transcript');
    }

    const keyId = this.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID;
    const keyPem = this.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM;
    if (!keyId || !keyPem) {
      throw new ServiceUnavailableException('video playback not configured');
    }

    const privateKey = await this.getSigningKey(keyPem);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expSeconds = nowSeconds + CloudflareStreamService.TOKEN_TTL_SECONDS;

    const token = await new SignJWT({ kid: keyId, sub: lesson.video_uid })
      .setProtectedHeader({ alg: 'RS256', kid: keyId })
      .setSubject(lesson.video_uid)
      .setIssuedAt(nowSeconds)
      .setNotBefore(nowSeconds)
      .setExpirationTime(expSeconds)
      .sign(privateKey);

    return {
      lesson_id: lessonId,
      token,
      hls_url: `https://videodelivery.net/${token}/manifest/video.m3u8`,
      expires_in: CloudflareStreamService.TOKEN_TTL_SECONDS,
    };
  }

  /**
   * Cloudflare returns the signing key PEM either raw or base64-encoded. We
   * accept both: a value that does not begin with the PKCS8 banner is treated
   * as base64 and decoded before import.
   */
  private async getSigningKey(keyPem: string): Promise<SigningKey> {
    if (this.signingKey) return this.signingKey;
    const pkcs8 = keyPem.includes('-----BEGIN')
      ? keyPem
      : Buffer.from(keyPem, 'base64').toString('utf8');
    this.signingKey = await importPKCS8(pkcs8, 'RS256');
    this.log.log('Loaded Cloudflare Stream signing key');
    return this.signingKey;
  }
}
