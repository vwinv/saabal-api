import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService], // PrismaService sera fourni par ce module
  exports: [PrismaService],   // On l’exporte pour pouvoir l’utiliser dans d’autres modules
})
export class PrismaModule {}
