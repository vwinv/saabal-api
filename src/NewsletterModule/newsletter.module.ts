import { Module } from '@nestjs/common';
import { NewsletterController } from './controller/newsletter.controller.js';
import { NewsletterService } from './service/newsletter.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [NewsletterController],
  providers: [NewsletterService, PrismaService],
})
export class NewsletterModule {}


