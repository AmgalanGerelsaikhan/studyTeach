# Module: Focus Mode (PRD §4.6)

> P1 module. Address the 33% of Mongolian students distracted by digital devices in class. Owner: `frontend-architect` + `backend-architect`.

## Purpose

Teacher-initiated session that restricts a student's app to the assigned activity for a bounded duration.

## Behavior

1. Teacher generates a one-time class code (6 chars, time-bounded).
2. Students join by entering the code.
3. While the session is active, student accounts are restricted to the assigned activity (a quiz, a tutor session on a specific topic, a reading).
4. Non-academic app features are suppressed.
5. Session ends automatically at scheduled time or when teacher closes it.
6. Optional: teacher receives an anonymous engagement summary post-session.

## Activities

- AI Tutor session on a specific strand.
- EGSh practice on a specific subject/topic.
- Teacher Academy lesson (for trainee teachers — niche).
- Reading from the curriculum library.

## Endpoints

| Method | Path                          | Notes                                 |
| ------ | ----------------------------- | ------------------------------------- |
| `POST` | `/focus/sessions`             | Teacher creates session; returns code |
| `POST` | `/focus/sessions/join`        | Student joins with code               |
| `POST` | `/focus/sessions/:id/close`   | Teacher ends early                    |
| `GET`  | `/focus/sessions/:id/summary` | Anonymous engagement (post-session)   |

## Behavior — restrictions

- Student client checks `/focus/me/active` on every navigation.
- If active, the only navigable routes are the assigned activity + a "leave" button (with confirmation; logged).
- Tabs / nav items for unrelated features are hidden, not just disabled.
- Refusal of the AI Tutor is **stricter** during Focus Mode — it stays on the assigned topic.

## Data

- Writes: `focus_sessions`, `focus_participants`, anonymous engagement metrics.
- No PII in engagement summary — only counts, durations, drop-off.

## UI (per prototype)

- **Teacher:** "create session" panel with activity picker + duration + class code preview; live participant counter.
- **Student:** lock screen with the assigned activity card and a "leave" button. Persona chrome reduced to bare minimum.

See `studyTeach (2)/teacher2.jsx` → `FocusModeTeacher` and `FocusModeStudent`.

## Tests

- Student cannot navigate to unrelated routes while session active.
- Session ends on schedule.
- Anonymous summary contains no user IDs.
- Tutor stays on assigned topic during Focus Mode.

## P1 acceptance

- [ ] Code-based join works on mobile + desktop.
- [ ] Restrictions enforced client + server side.
- [ ] Anonymous summary delivered post-session.
- [ ] Teacher can end session manually.
