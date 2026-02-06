import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { NewsletterService } from '../service/newsletter.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';
import { RolesGuard } from '../../AuthModule/guard/roles.guard.js';
import { Roles } from '../../AuthModule/decorator/roles.decorator.js';
import { Public } from '../../AuthModule/decorator/public.decorator.js';

@Controller('newsletters')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  create(@Body() body: {
    title: string;
    grosTitre?: string;
    content?: string;
    filename: string;
    mime: string;
    size: number;
    url?: string;
    editeurId: number;
    categorieId: number;
    dateJournal?: string;
  }, @Req() req: any) {
    return this.service.create({
      ...body,
      dateJournal: body.dateJournal ? new Date(body.dateJournal) : undefined,
    }, req.user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  update(@Param('id') id: string, @Body() body: {
    title?: string;
    grosTitre?: string;
    content?: string;
    filename?: string;
    mime?: string;
    size?: number;
    url?: string;
    editeurId?: number;
    categorieId?: number;
    dateJournal?: string;
  }, @Req() req: any) {
    return this.service.update({
      id: Number(id),
      ...body,
      dateJournal: body.dateJournal ? new Date(body.dateJournal) : undefined,
    }, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin', 'ADMIN', 'admin')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(Number(id), req.user.userId);
  }

  @Get('by-category')
  @Public()
  byCategory(@Query('categorieId') categorieId: string) {
    return this.service.listByCategoriePublic(Number(categorieId));
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


