import { Module } from '@nestjs/common';
import { PubliciteController } from './publicite.controller.js';
import { PubliciteService } from './publicite.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../AuthModule/auth.module.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  imports: [PrismaModule, AuthModule, CloudinaryModule],
  controllers: [PubliciteController],
  providers: [PubliciteService],
})
export class PubliciteModule {}

