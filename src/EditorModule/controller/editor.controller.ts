import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { EditorService } from '../service/editor.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';
import { RolesGuard } from '../../AuthModule/guard/roles.guard.js';
import { Roles } from '../../AuthModule/decorator/roles.decorator.js';
import { Public } from '../../AuthModule/decorator/public.decorator.js';

@Controller('editors')
export class EditorController {
  constructor(private readonly service: EditorService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  findAll() {
    return this.service.findAll();
  }

  @Get('public')
  @Public()
  findAllPublic() {
    return this.service.findAll();
  }

  @Get('by-day')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  byDay(@Query('date') date: string) {
    return this.service.listByDay(date);
  }

  @Get('by-month')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  byMonth(@Query('year') year: string, @Query('month') month: string) {
    return this.service.listByMonth(Number(year), Number(month) - 1);
  }

  @Get('by-range')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  byRange(@Query('start') start: string, @Query('end') end: string) {
    return this.service.listByRange(start, end);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  create(
    @Body() body: { nom: string; adminEmail: string },
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB max
          new FileTypeValidator({ fileType: /(image\/)(jpeg|jpg|png|webp|gif)$/ }),
        ],
      }),
    )
    logo?: any,
  ) {
    const nom = body?.nom || (body as any)?.nom;
    if (!nom) {
      throw new BadRequestException('Le nom de l\'éditeur est requis');
    }
    const adminEmail = body?.adminEmail || (body as any)?.adminEmail;
    if (!adminEmail) {
      throw new BadRequestException('L\'email administrateur est requis');
    }
    return this.service.createWithLogo(nom, adminEmail, logo);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  update(@Param('id') id: string, @Body() body: { nom?: string }) {
    return this.service.update({ id: Number(id), ...body });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}


