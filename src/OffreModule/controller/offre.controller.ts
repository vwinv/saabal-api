import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { OffreService } from '../service/offre.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';
import { Public } from '../../AuthModule/decorator/public.decorator.js';

@Controller('offres')
@UseGuards(JwtAuthGuard)
export class OffreController {
  constructor(private readonly service: OffreService) {}

  /**
   * Liste toutes les offres.
   * Route publique (utilisée par l'app et le dashboard admin).
   */
  @Get()
  @Public()
  findAll() {
    return this.service.findAll();
  }

  /**
   * Récupère une offre par son id.
   * Route publique pour permettre à l'app de lire le détail d'une offre.
   */
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  /**
   * Création d'une offre (réservé aux utilisateurs authentifiés).
   */
  @Post()
  create(@Body() body: { nom: string; prix: string; description?: string }) {
    return this.service.create(body);
  }

  /**
   * Mise à jour d'une offre (auth requis).
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { nom?: string; prix?: string; description?: string },
  ) {
    return this.service.update(Number(id), body);
  }

  /**
   * Suppression d'une offre (auth requis).
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
