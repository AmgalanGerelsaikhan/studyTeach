import { describe, expect, it } from 'vitest';

import { MockLlmVendor } from './mock.vendor';
import { OpenAiLlmVendor } from './openai.vendor';
import type { GenerateInput } from './types';

const fixedInput: GenerateInput = {
  model: 'mock-deterministic',
  messages: [
    { role: 'system', content: 'Та Монгол хэлээр хариулдаг багш.' },
    { role: 'user', content: 'Ньютоны хоёрдугаар хууль гэж юу вэ?' },
  ],
  max_tokens: 128,
  temperature: 0.3,
  request_id: 'req-test-1',
};

async function collect(stream: AsyncIterable<{ delta: string }>): Promise<string> {
  let out = '';
  for await (const chunk of stream) out += chunk.delta;
  return out;
}

describe('MockLlmVendor', () => {
  it('streams a deterministic response — same input → same output', async () => {
    const vendor = new MockLlmVendor();
    const a = await collect(vendor.generate(fixedInput));
    const b = await collect(vendor.generate(fixedInput));
    expect(a).toBe(b);
    expect(a).toMatch(/\[MOCK:[a-f0-9]{12}\]/);
  });

  it('yields at least 2 chunks so first-token latency is observable', async () => {
    const vendor = new MockLlmVendor();
    const collected: string[] = [];
    for await (const chunk of vendor.generate(fixedInput)) collected.push(chunk.delta);
    expect(collected.length).toBeGreaterThanOrEqual(2);
  });

  it('marks the final chunk with finish_reason=stop', async () => {
    const vendor = new MockLlmVendor();
    let last: { delta: string; finish_reason?: string } | undefined;
    for await (const chunk of vendor.generate(fixedInput)) last = chunk;
    expect(last?.finish_reason).toBe('stop');
  });

  it('produces 1024-dim unit-normalized embeddings', async () => {
    const vendor = new MockLlmVendor();
    const [vec] = await vendor.embed(['Ньютоны хууль']);
    expect(vec).toHaveLength(1024);
    const norm = Math.sqrt((vec ?? []).reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 6);
  });

  it('produces matching embeddings for identical texts and differing for distinct ones', async () => {
    const vendor = new MockLlmVendor();
    const [a1, a2, b] = await vendor.embed(['физик', 'физик', 'хими']);
    expect(a1).toEqual(a2);
    expect(a1).not.toEqual(b);
  });
});

describe('OpenAiLlmVendor (stub)', () => {
  it('crashes at construction when OPENAI_API_KEY is missing', () => {
    expect(
      () =>
        new OpenAiLlmVendor({
          NODE_ENV: 'test',
          API_PORT: 4000,
          WEB_ORIGIN: 'http://localhost:3000',
          DATABASE_URL: 'postgres://x',
          REDIS_URL: 'redis://x',
          SESSION_SECRET: 'x'.repeat(32),
          CSRF_SECRET: 'x'.repeat(16),
          LLM_VENDOR: 'openai',
          EBARIMT_SANDBOX_URL: 'https://sandbox.ebarimt.mn',
          TICKET_SIGNING_MODE: 'dev',
          TICKET_SIGNING_DEV_KEY_PATH: 'keys/dev-ticket-private.jwk.json',
          TICKET_SIGNING_DEV_PUBLIC_KEY_PATH: 'keys/dev-ticket-public.jwk.json',
          QPAY_WEBHOOK_SECRET: 'x'.repeat(16),
          SMS_INBOUND_SECRET: 'x'.repeat(16),
          SURGE_ENABLED: 'false',
          SURGE_THRESHOLD_RPS: 500,
          SURGE_CONSUME_MS: 80,
          // OPENAI_API_KEY deliberately omitted
        }),
    ).toThrow(/OPENAI_API_KEY is required/);
  });
});
