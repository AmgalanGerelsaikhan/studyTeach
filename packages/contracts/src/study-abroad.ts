import { z } from 'zod';

// Study Abroad Hub v2 — PRD §4.10a (Destination Blueprints) + §4.10b
// (Scholarship Aggregator). §4.10c AI Coach + §4.10d Alumni Network are P2.
//
// Mongolian Cyrillic only per hard constraint #1 (S06 narrowed locale).
// The spec mentions bilingual mn+en — that conflicts with constraint #1, so
// we ship mn-only and document the deviation in docs/modules/study-abroad-hub.md.

export const StudyAbroadDestinationCode = z.enum(['US', 'JP', 'KR', 'CN', 'RU', 'DE', 'UK', 'AU']);
export type StudyAbroadDestinationCode = z.infer<typeof StudyAbroadDestinationCode>;

export const StudyAbroadBlueprintSection = z.enum([
  'CORE_CONCEPT',
  'CORE_REQUIREMENTS',
  'FINANCIAL_PATHWAY',
  'APPLICATION_TIMELINE',
  'COMMON_PITFALLS',
]);
export type StudyAbroadBlueprintSection = z.infer<typeof StudyAbroadBlueprintSection>;

export const ScholarshipLevel = z.enum(['UG', 'PG', 'PHD']);
export type ScholarshipLevel = z.infer<typeof ScholarshipLevel>;

export const ScholarshipFundingType = z.enum(['FULL', 'PARTIAL', 'TUITION_ONLY']);
export type ScholarshipFundingType = z.infer<typeof ScholarshipFundingType>;

export const Destination = z.object({
  destination_code: StudyAbroadDestinationCode,
  name_mn: z.string(),
  primary_pathway_mn: z.string(),
  hero_image_url: z.string().nullable(),
  ordinal: z.number().int(),
});
export type Destination = z.infer<typeof Destination>;

export const DestinationBlueprint = z.object({
  blueprint_id: z.number().int(),
  destination_code: StudyAbroadDestinationCode,
  section: StudyAbroadBlueprintSection,
  body_mn: z.string(),
  ordinal: z.number().int(),
});
export type DestinationBlueprint = z.infer<typeof DestinationBlueprint>;

export const DestinationDetail = z.object({
  destination: Destination,
  blueprints: z.array(DestinationBlueprint),
});
export type DestinationDetail = z.infer<typeof DestinationDetail>;

export const Scholarship = z.object({
  scholarship_id: z.number().int(),
  name_mn: z.string(),
  funder: z.string(),
  destination_code: StudyAbroadDestinationCode,
  level: ScholarshipLevel,
  eligibility_mn: z.string(),
  deadline: z.string(),
  application_url: z.string(),
  document_checklist: z.array(z.string()),
  funding_type: ScholarshipFundingType,
});
export type Scholarship = z.infer<typeof Scholarship>;

export const ScholarshipListQuery = z.object({
  destination_code: StudyAbroadDestinationCode.optional(),
  level: ScholarshipLevel.optional(),
  funding_type: ScholarshipFundingType.optional(),
  deadline_within_days: z.number().int().positive().optional(),
});
export type ScholarshipListQuery = z.infer<typeof ScholarshipListQuery>;

export const ScholarshipWatch = z.object({
  watch_id: z.number().int(),
  scholarship_id: z.number().int(),
  notify_at: z.string().datetime().nullable(),
  notified_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type ScholarshipWatch = z.infer<typeof ScholarshipWatch>;
