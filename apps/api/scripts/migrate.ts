import 'dotenv/config';

import runner from 'node-pg-migrate';

const direction = process.argv[2] === 'down' ? 'down' : 'up';
const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  console.error('[migrate] DATABASE_URL not set — check .env or .env.local');
  process.exit(1);
}

runner({
  databaseUrl,
  dir: 'migrations',
  migrationsTable: 'pgmigrations',
  direction,
  count: direction === 'down' ? 1 : Infinity,
  verbose: true,
})
  .then((migrations) => {
    if (migrations.length === 0) {
      console.warn(`[migrate] no migrations to ${direction}`);
    } else {
      console.warn(`[migrate] ${direction}: ${migrations.map((m) => m.name).join(', ')}`);
    }
  })
  .catch((err: unknown) => {
    console.error('[migrate] failed:', err);
    process.exit(1);
  });
