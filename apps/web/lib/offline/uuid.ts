/* UUIDv7 — 48-bit ms timestamp + version + 74 bits randomness.
 * Used as the Idempotency-Key on every queued write (PRD §5.1.3, OFFLINE_STRATEGY.md §3).
 * Lexicographic order matches insertion order, which lets us FIFO the queue by key.
 */
export function uuidv7(now: number = Date.now()): string {
  const bytes = new Uint8Array(16);
  const ts = BigInt(now);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number((ts >> BigInt((5 - i) * 8)) & 0xffn);
  }
  const rand = new Uint8Array(10);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(rand);
  } else {
    for (let i = 0; i < rand.length; i++) rand[i] = Math.floor(Math.random() * 256);
  }
  bytes.set(rand, 6);
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
