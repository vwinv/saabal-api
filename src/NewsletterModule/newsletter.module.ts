import { Module } from '@nestjs/common';
import { NewsletterController } from './controller/newsletter.controller.js';
import { NewsletterService } from './service/newsletter.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  imports: [CloudinaryModule],
  controllers: [NewsletterController],
  providers: [NewsletterService, PrismaService],
})
export class NewsletterModule {}


