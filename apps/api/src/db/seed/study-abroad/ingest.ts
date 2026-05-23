import 'dotenv/config';

import { Pool } from 'pg';

import { loadEnv } from '../../../lib/config/env';

import { BLUEPRINTS, DESTINATIONS, SCHOLARSHIPS } from './fixtures';

/**
 * Study Abroad Hub ingest CLI (PRD §4.10a, §4.10b).
 *
 *   pnpm --filter @studyteach/api ingest:study-abroad
 *
 * Idempotent + re-runnable. Upserts off the natural keys in migration 0015:
 *   - destinations            PRIMARY KEY (destination_code)
 *   - destination_blueprints  UNIQUE (destination_code, section)
 *   - scholarships            UNIQUE (name_mn, funder, deadline)
 *
 * BLUEPRINTS and SCHOLARSHIPS arrays start empty; iteration scaffolding stays
 * in place so follow-up calls only append data to fixtures.ts.
 *
 * Destination/blueprint/scholarship content is content-ops data, not org-scoped
 * — the catalog is global.
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    let destinationCount = 0;
    let blueprintCount = 0;
    let scholarshipCount = 0;

    for (const destination of DESTINATIONS) {
      await pool.query(
        `INSERT INTO destinations
           (destination_code, name_mn, primary_pathway_mn, hero_image_url, ordinal)
         VALUES ($1::study_abroad_destination_code, $2, $3, $4, $5)
         ON CONFLICT (destination_code) DO UPDATE
           SET name_mn            = EXCLUDED.name_mn,
               primary_pathway_mn = EXCLUDED.primary_pathway_mn,
               hero_image_url     = EXCLUDED.hero_image_url,
               ordinal            = EXCLUDED.ordinal`,
        [
          destination.destination_code,
          destination.name_mn,
          destination.primary_pathway_mn,
          destination.hero_image_url,
          destination.ordinal,
        ],
      );
      destinationCount += 1;
    }

    for (const blueprint of BLUEPRINTS) {
      await pool.query(
        `INSERT INTO destination_blueprints
           (destination_code, section, body_mn, ordinal)
         VALUES ($1::study_abroad_destination_code, $2::study_abroad_blueprint_section, $3, $4)
         ON CONFLICT (destination_code, section) DO UPDATE
           SET body_mn = EXCLUDED.body_mn,
               ordinal = EXCLUDED.ordinal`,
        [blueprint.destination_code, blueprint.section, blueprint.body_mn, blueprint.ordinal],
      );
      blueprintCount += 1;
    }

    for (const scholarship of SCHOLARSHIPS) {
      await pool.query(
        `INSERT INTO scholarships
           (name_mn, funder, destination_code, level, eligibility_mn,
            deadline, application_url, document_checklist, funding_type)
         VALUES ($1, $2, $3::study_abroad_destination_code, $4::scholarship_level,
                 $5, $6, $7, $8::jsonb, $9::scholarship_funding_type)
         ON CONFLICT (name_mn, funder, deadline) DO UPDATE
           SET destination_code   = EXCLUDED.destination_code,
               level              = EXCLUDED.level,
               eligibility_mn     = EXCLUDED.eligibility_mn,
               application_url    = EXCLUDED.application_url,
               document_checklist = EXCLUDED.document_checklist,
               funding_type       = EXCLUDED.funding_type`,
        [
          scholarship.name_mn,
          scholarship.funder,
          scholarship.destination_code,
          scholarship.level,
          scholarship.eligibility_mn,
          scholarship.deadline,
          scholarship.application_url,
          JSON.stringify(scholarship.document_checklist),
          scholarship.funding_type,
        ],
      );
      scholarshipCount += 1;
    }

    console.warn(
      `[ingest:study-abroad] destinations:${destinationCount} · ` +
        `blueprints:${blueprintCount} · scholarships:${scholarshipCount}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('[ingest:study-abroad] failed:', err);
  process.exit(1);
});
