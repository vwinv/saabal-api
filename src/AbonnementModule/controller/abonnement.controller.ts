import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AbonnementService } from '../service/abonnement.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';

@Controller('abonnements')
@UseGuards(JwtAuthGuard)
export class AbonnementController {
  constructor(private readonly abonnementService: AbonnementService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.abonnementService.findAll();
  }

  @Get('stats/by-month')
  getStatsByMonth() {
    return this.abonnementService.getStatsByMonth();
  }

  @Get('stats/most-popular-offre')
  getMostPopularOffre() {
    return this.abonnementService.getMostPopularOffre();
  }

  @Get(':userId')
  getByUser(@Param('userId') userId: string) {
    return this.abonnementService.getByUserId(Number(userId));
  }

  @Post()
  create(@Body() body: { userId: number; offreId?: number | null; prix: string; debut: string; fin: string }) {
    return this.abonnementService.create({
      userId: body.userId,
      offreId: body.offreId ?? null,
      prix: body.prix,
      debut: new Date(body.debut),
      fin: new Date(body.fin),
    });
  }

  @Put(':userId')
  update(
    @Param('userId') userId: string,
    @Body() body: { offreId?: number | null; prix?: string; debut?: string; fin?: string },
  ) {
    return this.abonnementService.update(Number(userId), {
      offreId: body.offreId,
      prix: body.prix,
      debut: body.debut ? new Date(body.debut) : undefined,
      fin: body.fin ? new Date(body.fin) : undefined,
    });
  }

  @Delete(':userId')
  delete(@Param('userId') userId: string) {
    return this.abonnementService.deleteByUserId(Number(userId));
  }
}


