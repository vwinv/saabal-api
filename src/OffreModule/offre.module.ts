import { Module } from '@nestjs/common';
import { OffreController } from './controller/offre.controller.js';
import { OffreService } from './service/offre.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [OffreController],
  providers: [OffreService],
  exports: [OffreService],
})
export class OffreModule {}
