/**
 * Local sessions list backed by the `tutor-sessions` IDB store (db.ts).
 *
 * IDB schema doesn't need bumping — we serialize the metadata as JSON into the
 * existing `body` column. The store's `by-expires_at` index lets us trim old
 * entries cheaply when we add eviction (E-009 carry-over for the 7-day cache).
 */
import { openDb } from './db';

const RETENTION_DAYS = 7;

export interface LocalTutorSession {
  session_id: string;
  subject: string;
  grade: number;
  lang: string;
  first_user_text: string | null;
  started_at: number;
}

interface PersistedBody {
  subject: string;
  grade: number;
  lang: string;
  first_user_text: string | null;
}

function expiresAt(now: number): number {
  return now + RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

export async function upsertLocalSession(
  session: Omit<LocalTutorSession, 'started_at'> & { started_at?: number },
): Promise<void> {
  const db = await openDb();
  const startedAt = session.started_at ?? Date.now();
  const body: PersistedBody = {
    subject: session.subject,
    grade: session.grade,
    lang: session.lang,
    first_user_text: session.first_user_text,
  };
  await db.put('tutor-sessions', {
    session_id: session.session_id,
    started_at: startedAt,
    expires_at: expiresAt(startedAt),
    body: JSON.stringify(body),
  });
}

export async function setFirstUserText(sessionId: string, text: string): Promise<void> {
  const db = await openDb();
  const existing = await db.get('tutor-sessions', sessionId);
  if (!existing) return;
  let parsed: PersistedBody;
  try {
    parsed = JSON.parse(existing.body) as PersistedBody;
  } catch {
    return;
  }
  if (parsed.first_user_text) return; // only stamp the first turn
  const next: PersistedBody = { ...parsed, first_user_text: text };
  await db.put('tutor-sessions', {
    ...existing,
    body: JSON.stringify(next),
  });
}

export async function listLocalSessions(limit = 20): Promise<LocalTutorSession[]> {
  const db = await openDb();
  const all = await db.getAll('tutor-sessions');
  const parsed: LocalTutorSession[] = [];
  for (const row of all) {
    try {
      const body = JSON.parse(row.body) as PersistedBody;
      parsed.push({
        session_id: row.session_id,
        subject: body.subject,
        grade: body.grade,
        lang: body.lang,
        first_user_text: body.first_user_text,
        started_at: row.started_at,
      });
    } catch {
      // ignore corrupt rows; they'll be evicted on schema bump
    }
  }
  parsed.sort((a, b) => b.started_at - a.started_at);
  return parsed.slice(0, limit);
}

export async function deleteLocalSession(sessionId: string): Promise<void> {
  const db = await openDb();
  await db.delete('tutor-sessions', sessionId);
}
