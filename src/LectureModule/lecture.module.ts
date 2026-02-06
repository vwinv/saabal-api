import { Module } from '@nestjs/common';
import { LectureController } from './controller/lecture.controller.js';
import { LectureService } from './service/lecture.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [LectureController],
  providers: [LectureService],
  exports: [LectureService],
})
export class LectureModule {}
