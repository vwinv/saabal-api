import { Controller, Get, Post, Delete, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './AuthModule/guard/jwt-auth.guard.js';
import { RolesGuard } from './AuthModule/guard/roles.guard.js';
import { Roles } from './AuthModule/decorator/roles.decorator.js';
import { Public } from './AuthModule/decorator/public.decorator.js';
import { apiSuccess } from './common/api-response.js';

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
  @Public()
  async getCategories() {
    const categories = await this.prisma.categorie.findMany({
      orderBy: { name: 'asc' },
    });
    return apiSuccess(categories, '');
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  async createCategory(@Body() body: { name: string }) {
    if (!body.name || !body.name.trim()) {
      throw new BadRequestException('Le nom de la catégorie est requis');
    }
    try {
      const category = await this.prisma.categorie.create({
        data: { name: body.name.trim() },
      });
      return apiSuccess(category, 'Catégorie créée avec succès');
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Une catégorie avec ce nom existe déjà');
      }
      throw error;
    }
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'super-admin')
  async deleteCategory(@Param('id') id: string) {
    const categoryId = Number(id);
    if (Number.isNaN(categoryId)) {
      throw new BadRequestException('Identifiant de catégorie invalide');
    }

    // Empêcher la suppression si des journaux utilisent encore cette catégorie
    const relatedJournalsCount = await this.prisma.journal.count({
      where: { categorieId: categoryId },
    });
    if (relatedJournalsCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cette catégorie car des journaux y sont encore rattachés.',
      );
    }

    await this.prisma.categorie.delete({ where: { id: categoryId } });
    return apiSuccess(null, 'Catégorie supprimée avec succès');
  }
}
