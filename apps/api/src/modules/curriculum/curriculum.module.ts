import { Module } from '@nestjs/common';

import { CurriculumService } from './curriculum.service';

/**
 * Read-side module for the AI Tutor RAG pipeline. Writes (ingest) happen
 * out-of-band via the `ingest:curriculum` CLI — there is no controller for
 * mutation of curriculum_chunks because the corpus is publication-managed,
 * not user-managed.
 */
@Module({
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
