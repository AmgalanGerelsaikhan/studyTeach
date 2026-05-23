/**
 * LLM vendor contract. Every code path that calls a model — generation or
 * embeddings — goes through a vendor that implements this interface. The Nest
 * provider is chosen at bootstrap from ENV.LLM_VENDOR (see llm.module.ts).
 *
 * Streaming (AsyncIterable<TokenChunk>) is mandatory so the API can honor the
 * S03 exit gate "p95 first-token latency <2s on 3G". The mock vendor must also
 * stream, otherwise the latency gate is not measurable in CI.
 */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface GenerateInput {
  /** Model identifier (e.g. 'gpt-4o-2024-08-06', or 'mock-deterministic' for tests). */
  model: string;
  messages: ChatTurn[];
  /** Server-enforced ceiling, in tokens. Tutor budget = 50K / session split per turn. */
  max_tokens: number;
  /** Default 0.3 for the tutor; explicit per call. */
  temperature?: number;
  stop?: string[];
  /** Audit + cache key. Required so every call is traceable in audit_log. */
  request_id: string;
}

export type FinishReason = 'stop' | 'length' | 'content_filter';

export interface TokenChunk {
  delta: string;
  finish_reason?: FinishReason;
}

export type VendorName = 'mock' | 'openai' | 'azure-openai' | 'local';

export interface LlmVendor {
  readonly name: VendorName;
  /** Streaming generation. Always returns an async iterable, even for vendors
   *  that batch internally — the wrapper yields a single chunk in that case. */
  generate(input: GenerateInput): AsyncIterable<TokenChunk>;
  /** Returns 1024-dimensional vectors aligned with curriculum_chunks.embedding. */
  embed(texts: string[]): Promise<number[][]>;
}

/** Token used to inject the active LlmVendor into Nest providers. */
export const LLM_VENDOR_TOKEN = Symbol('LlmVendor');
