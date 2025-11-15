import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './AuthModule/guard/jwt-auth.guard.js';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  async getCategories() {
    const categories = await this.prisma.categorie.findMany({
      orderBy: { name: 'asc' },
    });
    return { data: categories };
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  async createCategory(@Body() body: { name: string }) {
    if (!body.name || !body.name.trim()) {
      throw new BadRequestException('Le nom de la catégorie est requis');
    }
    try {
      const category = await this.prisma.categorie.create({
        data: { name: body.name.trim() },
      });
      return { data: category, message: 'Catégorie créée avec succès' };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Une catégorie avec ce nom existe déjà');
      }
      throw error;
    }
  }
}
