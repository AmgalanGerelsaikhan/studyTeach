import { describe, expect, it } from 'vitest';

import { uuidv7 } from '@/lib/offline/uuid';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('uuidv7', () => {
  it('matches the UUID shape', () => {
    expect(uuidv7()).toMatch(UUID_RE);
  });

  it('embeds version 7 in the high nibble of byte 6', () => {
    expect(uuidv7().split('-')[2]![0]).toBe('7');
  });

  it('embeds the RFC 4122 variant in byte 8', () => {
    const variantNibble = uuidv7().split('-')[3]![0]!;
    expect(['8', '9', 'a', 'b']).toContain(variantNibble);
  });

  it('orders lexicographically with the millisecond timestamp', () => {
    const a = uuidv7(1_700_000_000_000);
    const b = uuidv7(1_700_000_000_001);
    expect(a < b).toBe(true);
  });

  it('produces distinct values for the same timestamp', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(uuidv7(1_700_000_000_000));
    expect(seen.size).toBe(200);
  });
});
