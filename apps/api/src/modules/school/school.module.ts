import { Module } from '@nestjs/common';

import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';

/**
 * School-admin surface (PRD §4.4). v1 is a single teachers index used by
 * /school/teachers — clicks through to the existing CPD transcript page
 * at /school/teachers/[teacherUserId]/cpd.
 */
@Module({
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
