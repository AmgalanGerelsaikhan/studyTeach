import { Inject, Injectable } from '@nestjs/common';

import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

import type { GenerateInput, LlmVendor, TokenChunk } from './types';

/**
 * Stub for the OpenAI vendor. Loud-fail on construction if OPENAI_API_KEY is
 * not present — CLAUDE.md hard constraint #11 says env vars must be confirmed
 * loaded inside the running process; we'd rather crash at bootstrap than ship
 * a silently-degraded tutor.
 *
 * The real fetch implementation lands in S03 follow-up T-OpenAI once
 * (a) ADR-0011 zero-retention contract is signed and
 * (b) docs/compliance/dpia-openai.md is filed.
 * Until then, calling `generate` or `embed` throws.
 */
@Injectable()
export class OpenAiLlmVendor implements LlmVendor {
  readonly name = 'openai' as const;

  constructor(@Inject(ENV) env: Env) {
    if (!env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY is required when LLM_VENDOR=openai. Set the key or switch LLM_VENDOR=mock.',
      );
    }
  }

  generate(_input: GenerateInput): AsyncIterable<TokenChunk> {
    throw new Error(
      'OpenAiLlmVendor.generate() not yet implemented. Zero-retention contract + DPIA pending — see ADR-0011.',
    );
  }

  embed(_texts: string[]): Promise<number[][]> {
    throw new Error(
      'OpenAiLlmVendor.embed() not yet implemented. Zero-retention contract + DPIA pending — see ADR-0011.',
    );
  }
}
