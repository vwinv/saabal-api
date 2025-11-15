import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller.js';
import { UserService } from './service/user.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../AuthModule/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}


