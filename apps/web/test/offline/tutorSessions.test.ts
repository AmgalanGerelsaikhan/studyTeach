import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { __resetDbForTests, openDb } from '@/lib/offline/db';
import {
  deleteLocalSession,
  listLocalSessions,
  setFirstUserText,
  upsertLocalSession,
} from '@/lib/offline/tutorSessions';

describe('tutorSessions (IDB)', () => {
  beforeEach(async () => {
    const db = await openDb();
    await db.clear('tutor-sessions');
  });

  afterEach(() => {
    __resetDbForTests();
  });

  it('persists a session and reads it back', async () => {
    await upsertLocalSession({
      session_id: 'sess-1',
      subject: 'physics',
      grade: 11,
      lang: 'mn-Cyrl',
      first_user_text: null,
    });
    const list = await listLocalSessions();
    expect(list).toHaveLength(1);
    expect(list[0]?.subject).toBe('physics');
    expect(list[0]?.first_user_text).toBeNull();
  });

  it('orders by started_at desc', async () => {
    const base = Date.now();
    await upsertLocalSession({
      session_id: 'older',
      subject: 'math',
      grade: 11,
      lang: 'mn-Cyrl',
      first_user_text: null,
      started_at: base - 10_000,
    });
    await upsertLocalSession({
      session_id: 'newer',
      subject: 'physics',
      grade: 11,
      lang: 'mn-Cyrl',
      first_user_text: null,
      started_at: base,
    });
    const list = await listLocalSessions();
    expect(list.map((s) => s.session_id)).toEqual(['newer', 'older']);
  });

  it('stamps first_user_text only on the first call', async () => {
    await upsertLocalSession({
      session_id: 'sess-2',
      subject: 'physics',
      grade: 11,
      lang: 'mn-Cyrl',
      first_user_text: null,
    });
    await setFirstUserText('sess-2', 'first question');
    await setFirstUserText('sess-2', 'second question');
    const list = await listLocalSessions();
    expect(list[0]?.first_user_text).toBe('first question');
  });

  it('deletes a session by id', async () => {
    await upsertLocalSession({
      session_id: 'gone',
      subject: 'math',
      grade: 11,
      lang: 'mn-Cyrl',
      first_user_text: null,
    });
    await deleteLocalSession('gone');
    expect(await listLocalSessions()).toHaveLength(0);
  });
});
