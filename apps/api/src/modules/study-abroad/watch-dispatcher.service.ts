import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Db } from '../../lib/db/pool';
import { SmsService } from '../sms/sms.service';

/**
 * Fires deadline-reminder SMS for scholarship watches whose `notify_at` has
 * elapsed. The watch row is created 7 days before the scholarship's deadline
 * (see StudyAbroadService.watch); this dispatcher catches up on any row whose
 * notify_at is now in the past AND that hasn't been notified yet.
 *
 * Idempotent: every successful send flips `notified_at`, so a watch fires at
 * most once. Failures leave `notified_at = NULL` and the next tick retries.
 *
 * Runs every hour. The clock granularity is intentionally coarse — these are
 * 7-day-out reminders, not minute-precise notifications.
 */
@Injectable()
export class ScholarshipWatchDispatcher {
  private readonly log = new Logger(ScholarshipWatchDispatcher.name);

  constructor(
    private readonly db: Db,
    private readonly sms: SmsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async dispatch(): Promise<void> {
    const { rows: due } = await this.db.query<{
      watch_id: string;
      user_id: number;
      phone_number: string | null;
      scholarship_name: string;
      deadline: Date;
    }>(
      `SELECT sw.watch_id::text,
              sw.user_id,
              u.phone_number,
              s.name_mn AS scholarship_name,
              s.deadline
         FROM scholarship_watches sw
         JOIN users u        ON u.user_id = sw.user_id
         JOIN scholarships s ON s.scholarship_id = sw.scholarship_id
        WHERE sw.notified_at IS NULL
          AND sw.notify_at IS NOT NULL
          AND sw.notify_at <= NOW()
        ORDER BY sw.notify_at ASC
        LIMIT 200`,
    );
    if (due.length === 0) return;
    this.log.log(`dispatching ${due.length} scholarship-deadline reminders`);

    for (const row of due) {
      if (!row.phone_number) {
        // No phone → mark as notified so we don't keep re-fetching it.
        await this.markNotified(row.watch_id);
        continue;
      }
      try {
        await this.sms.send('scholarship-deadline-reminder', row.phone_number, {
          scholarship: row.scholarship_name,
          deadline: row.deadline.toISOString().slice(0, 10),
        });
        await this.markNotified(row.watch_id);
      } catch (err) {
        this.log.warn(
          `watch ${row.watch_id} send failed; will retry next tick: ${(err as Error).message}`,
        );
        // Leave notified_at NULL so the next cron picks it up again.
      }
    }
  }

  private async markNotified(watchId: string): Promise<void> {
    await this.db.query(`UPDATE scholarship_watches SET notified_at = NOW() WHERE watch_id = $1`, [
      watchId,
    ]);
  }
}
