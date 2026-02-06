import { Module } from '@nestjs/common';
import { EditorController } from './controller/editor.controller.js';
import { EditorService } from './service/editor.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [CloudinaryModule, MailModule],
  controllers: [EditorController],
  providers: [EditorService, PrismaService],
})
export class EditorModule {}


