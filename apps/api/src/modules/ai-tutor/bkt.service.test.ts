import { describe, expect, it } from 'vitest';

import { bktUpdate } from './bkt.service';

describe('bktUpdate (Corbett & Anderson 1995 step)', () => {
  it('correct observation increases the posterior', () => {
    const prior = 0.3;
    const next = bktUpdate(prior, true);
    expect(next).toBeGreaterThan(prior);
  });

  it('wrong observation decreases the posterior (then forward by p_transit)', () => {
    const prior = 0.6;
    const next = bktUpdate(prior, false);
    expect(next).toBeLessThan(prior);
  });

  it('converges toward 1 after a run of correct observations', () => {
    let p = 0.3;
    for (let i = 0; i < 8; i += 1) p = bktUpdate(p, true);
    expect(p).toBeGreaterThan(0.95);
  });

  it('stays low after a run of wrong observations', () => {
    let p = 0.3;
    for (let i = 0; i < 8; i += 1) p = bktUpdate(p, false);
    expect(p).toBeLessThan(0.2);
  });

  it('never exits the open interval (0, 1)', () => {
    const samples = [0.0001, 0.1, 0.5, 0.9, 0.9999];
    for (const p of samples) {
      expect(bktUpdate(p, true)).toBeGreaterThan(0);
      expect(bktUpdate(p, true)).toBeLessThan(1);
      expect(bktUpdate(p, false)).toBeGreaterThanOrEqual(0);
      expect(bktUpdate(p, false)).toBeLessThan(1);
    }
  });
});
