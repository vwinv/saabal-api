import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PubliciteService } from './publicite.service.js';
import { JwtAuthGuard } from '../AuthModule/guard/jwt-auth.guard.js';
import { RolesGuard } from '../AuthModule/guard/roles.guard.js';
import { Roles } from '../AuthModule/decorator/roles.decorator.js';
import { Public } from '../AuthModule/decorator/public.decorator.js';

@Controller('publicites')
export class PubliciteController {
  constructor(private readonly publiciteService: PubliciteService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin') // uniquement superadmin
  async findAll() {
    return this.publiciteService.findAll();
  }

  // Route publique pour récupérer les publicités actives (sans token)
  @Get('active')
  @Public()
  async findActive() {
    return this.publiciteService.findActive();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async create(
    @Body()
    body: {
      titre: string;
      description?: string;
    },
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
          new FileTypeValidator({ fileType: /(image\/jpeg|image\/png|image\/webp)$/ }),
        ],
      }),
    )
    image: any,
  ) {
    return this.publiciteService.create(
      {
        titre: body.titre,
        description: body.description,
      },
      image,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.publiciteService.delete(id);
  }
}

