'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { LessonSummary } from '@studyteach/contracts';

import { StCard, StIcon } from '@/components/st';
import { getPlaybackToken } from '@/lib/api/teacher-academy';

/**
 * Lesson video player. Fetches a signed Cloudflare Stream playback grant
 * from GET /lessons/:id/playback and plays the HLS manifest.
 *
 * Falls back to the lesson transcript when:
 *  - the lesson has no video (`lesson.has_video` is false),
 *  - the token request fails (server error, 4xx),
 *  - the browser is offline.
 *
 * 3G budget: the player is mounted lazily per selected lesson, the manifest
 * URL is signed server-side, and we never pull a heavy JS HLS lib — modern
 * mobile browsers (and the PWA's target devices) play HLS natively via the
 * <video> element. When native HLS is absent we degrade to the transcript.
 */

type PlayerState =
  | { kind: 'loading' }
  | { kind: 'ready'; hlsUrl: string }
  | { kind: 'fallback'; reason: 'no_video' | 'offline' | 'error' };

function nativeHlsSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.createElement('video');
  return (
    el.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    el.canPlayType('application/x-mpegURL') !== ''
  );
}

export function LessonVideo({
  lesson,
  transcriptMn,
}: {
  lesson: LessonSummary;
  transcriptMn: string;
}) {
  const t = useTranslations('teacher.academy.player');
  const [state, setState] = useState<PlayerState>({ kind: 'loading' });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!lesson.has_video) {
      setState({ kind: 'fallback', reason: 'no_video' });
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState({ kind: 'fallback', reason: 'offline' });
      return;
    }

    setState({ kind: 'loading' });
    getPlaybackToken(lesson.lesson_id)
      .then((token) => {
        if (cancelled) return;
        if (!nativeHlsSupported()) {
          setState({ kind: 'fallback', reason: 'error' });
          return;
        }
        setState({ kind: 'ready', hlsUrl: token.hls_url });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'fallback', reason: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [lesson.lesson_id, lesson.has_video]);

  if (state.kind === 'loading') {
    return (
      <StCard padding="md">
        <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {t('videoLoading')}
        </p>
      </StCard>
    );
  }

  if (state.kind === 'ready') {
    return (
      <div data-testid="lesson-video">
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          className="w-full rounded-st-md border"
          style={{ borderColor: 'rgba(185, 132, 56, 0.35)', background: 'var(--st-soot)' }}
          src={state.hlsUrl}
          // If the manifest itself fails mid-load, degrade to transcript.
          onError={() => setState({ kind: 'fallback', reason: 'error' })}
        >
          <track kind="captions" />
        </video>
      </div>
    );
  }

  // Fallback: transcript-only view.
  const noticeKey =
    state.reason === 'no_video'
      ? 'noVideo'
      : state.reason === 'offline'
        ? 'videoOffline'
        : 'videoUnavailable';

  return (
    <div data-testid="lesson-video-fallback">
      <p
        className="mb-2 flex items-center gap-1.5 rounded-st-md border p-2.5 text-[12px]"
        style={{
          borderColor: 'rgba(185, 132, 56, 0.4)',
          background: 'rgba(185, 132, 56, 0.1)',
          color: 'var(--st-brass-dark)',
        }}
      >
        <StIcon name={state.reason === 'offline' ? 'wifi_off' : 'file'} size={13} />
        {t(noticeKey)}
      </p>
      <StCard padding="md">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('transcriptEyebrow')}
        </p>
        <p
          className="mt-2 whitespace-pre-line text-sm leading-relaxed"
          style={{ color: 'var(--st-ink)' }}
        >
          {transcriptMn}
        </p>
      </StCard>
    </div>
  );
}
