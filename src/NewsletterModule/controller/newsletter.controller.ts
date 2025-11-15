import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { NewsletterService } from '../service/newsletter.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';

@Controller('newsletters')
@UseGuards(JwtAuthGuard)
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post()
  create(@Body() body: { 
    title: string; 
    content?: string; 
    filename: string;
    mime: string;
    size: number;
    url?: string;
    editeurId: number;
    categorieId: number;
    dateJournal?: string;
  }) {
    return this.service.create({
      ...body,
      dateJournal: body.dateJournal ? new Date(body.dateJournal) : undefined,
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { 
    title?: string; 
    content?: string;
    filename?: string;
    mime?: string;
    size?: number;
    url?: string;
    editeurId?: number;
    categorieId?: number;
    dateJournal?: string;
  }) {
    return this.service.update({ 
      id: Number(id), 
      ...body,
      dateJournal: body.dateJournal ? new Date(body.dateJournal) : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @Get('by-day')
  byDay(@Query('date') date: string) {
    return this.service.listByDay(date);
  }

  @Get('by-month')
  byMonth(@Query('year') year: string, @Query('month') month: string) {
    // month is 1-based from API clients usually; convert to 0-based
    return this.service.listByMonth(Number(year), Number(month) - 1);
  }

  @Get('by-range')
  byRange(@Query('start') start: string, @Query('end') end: string) {
    return this.service.listByRange(start, end);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}


