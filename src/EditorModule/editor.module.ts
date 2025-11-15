import { Module } from '@nestjs/common';
import { EditorController } from './controller/editor.controller.js';
import { EditorService } from './service/editor.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [EditorController],
  providers: [EditorService, PrismaService],
})
export class EditorModule {}


