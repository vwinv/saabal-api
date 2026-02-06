import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { apiSuccess } from '../../common/api-response.js';

@Injectable()
export class OffreService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const offres = await this.prisma.offre.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(offres, '');
  }

  async findOne(id: number) {
    const offre = await this.prisma.offre.findUnique({ where: { id } });
    if (!offre) throw new NotFoundException('Offre introuvable');
    return apiSuccess(offre, '');
  }

  async create(body: { nom: string; prix: string; description?: string }) {
    if (!body.nom?.trim()) throw new BadRequestException('Le nom de l\'offre est requis');
    const prix = parseFloat(body.prix);
    if (Number.isNaN(prix) || prix < 0) throw new BadRequestException('Prix invalide');
    const offre = await this.prisma.offre.create({
      data: {
        nom: body.nom.trim(),
        prix: String(prix),
        description: body.description?.trim() || null,
      } as any,
    });
    return apiSuccess(offre, 'Offre créée');
  }

  async update(id: number, body: { nom?: string; prix?: string; description?: string }) {
    const existing = await this.prisma.offre.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Offre introuvable');
    const data: any = {};
    if (body.nom !== undefined) data.nom = body.nom.trim();
    if (body.prix !== undefined) {
      const prix = parseFloat(body.prix);
      if (Number.isNaN(prix) || prix < 0) throw new BadRequestException('Prix invalide');
      data.prix = String(prix);
    }
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    const offre = await this.prisma.offre.update({
      where: { id },
      data,
    });
    return apiSuccess(offre, 'Offre mise à jour');
  }

  async remove(id: number) {
    const existing = await this.prisma.offre.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Offre introuvable');
    await this.prisma.offre.delete({ where: { id } });
    return apiSuccess(null, 'Offre supprimée');
  }
}
