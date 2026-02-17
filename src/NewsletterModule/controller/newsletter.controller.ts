import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NewsletterService } from '../service/newsletter.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';
import { RolesGuard } from '../../AuthModule/guard/roles.guard.js';
import { Roles } from '../../AuthModule/decorator/roles.decorator.js';
import { Public } from '../../AuthModule/decorator/public.decorator.js';

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50 MB

@Controller('newsletters')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  @UseInterceptors(FileInterceptor('pdf', { storage: memoryStorage() }))
  async create(
    @Body()
    body: {
      title: string;
      grosTitre?: string;
      content?: string;
      filename?: string;
      mime?: string;
      size?: number;
      url?: string;
      editeurId: string;
      categorieId: string;
      dateJournal?: string;
    },
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PDF_SIZE }),
          new FileTypeValidator({ fileType: /application\/pdf$/ }),
        ],
      }),
    )
    pdf?: any,
    @Req() req?: any,
  ) {
    const userId = req?.user?.userId;
    if (pdf) {
      return this.service.createWithPdf(
        {
          title: body.title,
          grosTitre: body.grosTitre,
          editeurId: Number(body.editeurId),
          categorieId: Number(body.categorieId),
          dateJournal: body.dateJournal,
        },
        pdf,
        userId,
      );
    }
    if (body.content) {
      return this.service.create(
        {
          ...body,
          editeurId: Number(body.editeurId),
          categorieId: Number(body.categorieId),
          filename: body.filename ?? 'document.pdf',
          mime: body.mime ?? 'application/pdf',
          size: body.size ?? 0,
          dateJournal: body.dateJournal ? new Date(body.dateJournal) : undefined,
        },
        userId,
      );
    }
    throw new BadRequestException('Veuillez joindre un fichier PDF ou fournir un lien.');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  @UseInterceptors(FileInterceptor('pdf', { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      grosTitre?: string;
      content?: string;
      filename?: string;
      mime?: string;
      size?: number;
      url?: string;
      editeurId?: string;
      categorieId?: string;
      dateJournal?: string;
    },
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PDF_SIZE }),
          new FileTypeValidator({ fileType: /application\/pdf$/ }),
        ],
      }),
    )
    pdf?: any,
    @Req() req?: any,
  ) {
    const userId = req?.user?.userId;
    const updateData: any = {
      id: Number(id),
      title: body.title,
      grosTitre: body.grosTitre,
      content: body.content,
      filename: body.filename,
      mime: body.mime,
      size: body.size !== undefined ? Number(body.size) : undefined,
      url: body.url,
      editeurId: body.editeurId ? Number(body.editeurId) : undefined,
      categorieId: body.categorieId ? Number(body.categorieId) : undefined,
      dateJournal: body.dateJournal ? new Date(body.dateJournal) : undefined,
    };
    if (pdf) {
      return this.service.updateWithPdf(Number(id), updateData, pdf, userId);
    }
    return this.service.update(updateData, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(Number(id), req.user.userId);
  }

  @Get('by-category')
  @Public()
  byCategory(
    @Query('categorieId') categorieId: string,
    @Query('q') q?: string,
  ) {
    return this.service.listByCategoriePublic(Number(categorieId), q);
  }

  @Get('by-day')
  @Public()
  byDay(@Query('date') date: string) {
    return this.service.listByDayPublic(date);
  }

  @Get('by-month')
  @Public()
  byMonth(@Query('year') year: string, @Query('month') month: string) {
    // month is 1-based from API clients usually; convert to 0-based
    return this.service.listByMonthPublic(Number(year), Number(month) - 1);
  }

  @Get('by-range')
  @Public()
  byRange(@Query('start') start: string, @Query('end') end: string) {
    return this.service.listByRangePublic(start, end);
  }

  @Get()
  @Public()
  findAll() {
    return this.service.findAllPublic();
  }
}


