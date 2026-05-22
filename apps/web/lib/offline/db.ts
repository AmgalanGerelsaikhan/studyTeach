/* IndexedDB v1 schema for the MozaTeach PWA.
 * Stores are defined in docs/OFFLINE_STRATEGY.md §2. Access goes through `openDb()`;
 * direct IDBOpenDBRequest use is forbidden by ADR (see strategy doc).
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const DB_NAME = 'studyteach-offline';
export const DB_VERSION = 1;

export type PendingMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type PendingStatus = 'queued' | 'in_flight' | 'failed' | 'paused';

export interface PendingWrite {
  /** UUIDv7 idempotency key. Doubles as primary key + Idempotency-Key header. */
  id: string;
  method: PendingMethod;
  url: string;
  /** JSON-encoded body. Binary uploads aren't queued v2.0.0. */
  body: string | null;
  headers: Record<string, string>;
  scope: { organization_code: string | null; user_id: number | null };
  createdAt: number;
  attempts: number;
  lastError: string | null;
  status: PendingStatus;
}

export interface TicketRecord {
  registration_id: string;
  student_name: string;
  venue: string;
  seat: string | null;
  exam_time: string;
  qr_payload: string;
  qr_png_blob: Blob | null;
  signed_at: number;
  exam_date: string;
}

export interface MockTestRecord {
  paper_id: string;
  subject: string;
  year: number;
  body: string;
  fetched_at: number;
  last_opened_at: number;
}

export interface TutorSessionRecord {
  session_id: string;
  started_at: number;
  expires_at: number;
  body: string;
}

export interface CurriculumChunkRecord {
  chunk_id: string;
  subject: string;
  grade: number;
  body: string;
  fetched_at: number;
  last_opened_at: number;
}

export interface FormDraftRecord {
  draft_id: string;
  form_kind: string;
  body: string;
  updated_at: number;
}

interface StudyTeachDB extends DBSchema {
  'pending-writes': {
    key: string;
    value: PendingWrite;
    indexes: { 'by-status': PendingStatus; 'by-createdAt': number };
  };
  tickets: {
    key: string;
    value: TicketRecord;
    indexes: { 'by-exam_date': string };
  };
  'mock-tests': {
    key: string;
    value: MockTestRecord;
    indexes: { 'by-last_opened_at': number };
  };
  'tutor-sessions': {
    key: string;
    value: TutorSessionRecord;
    indexes: { 'by-expires_at': number };
  };
  'curriculum-cache': {
    key: string;
    value: CurriculumChunkRecord;
    indexes: { 'by-last_opened_at': number };
  };
  'forms-draft': {
    key: string;
    value: FormDraftRecord;
    indexes: { 'by-updated_at': number };
  };
}

let dbPromise: Promise<IDBPDatabase<StudyTeachDB>> | null = null;

export function openDb(): Promise<IDBPDatabase<StudyTeachDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StudyTeachDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const pending = db.createObjectStore('pending-writes', { keyPath: 'id' });
          pending.createIndex('by-status', 'status');
          pending.createIndex('by-createdAt', 'createdAt');

          const tickets = db.createObjectStore('tickets', { keyPath: 'registration_id' });
          tickets.createIndex('by-exam_date', 'exam_date');

          const mocks = db.createObjectStore('mock-tests', { keyPath: 'paper_id' });
          mocks.createIndex('by-last_opened_at', 'last_opened_at');

          const tutor = db.createObjectStore('tutor-sessions', { keyPath: 'session_id' });
          tutor.createIndex('by-expires_at', 'expires_at');

          const curriculum = db.createObjectStore('curriculum-cache', { keyPath: 'chunk_id' });
          curriculum.createIndex('by-last_opened_at', 'last_opened_at');

          const forms = db.createObjectStore('forms-draft', { keyPath: 'draft_id' });
          forms.createIndex('by-updated_at', 'updated_at');
        }
      },
    });
  }
  return dbPromise;
}

/** Test helper. Resets the singleton so a new schema can be reopened. */
export function __resetDbForTests() {
  dbPromise = null;
}
