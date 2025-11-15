import { Module } from '@nestjs/common';
import { AbonnementController } from './controller/abonnement.controller.js';
import { AbonnementService } from './service/abonnement.service.js';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AbonnementController],
  providers: [AbonnementService, PrismaService],
})
export class AbonnementModule {}


