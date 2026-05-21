import { Inject, Injectable } from '@nestjs/common';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

/**
 * Thin wrapper around pg.Pool. All DB access goes through here so we have a
 * single place to wire instrumentation, tenant-scope context, and shutdown.
 */
@Injectable()
export class Db {
  private readonly pool: Pool;

  constructor(@Inject(ENV) env: Env) {
    this.pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params as unknown[]);
  }

  withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    return this.pool.connect().then(async (client) => {
      try {
        return await fn(client);
      } finally {
        client.release();
      }
    });
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}
