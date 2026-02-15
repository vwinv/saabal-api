import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { apiSuccess } from '../../common/api-response.js';

type CreateInput = {
  userId: number;
  offreId?: number | null;
  prix: string;
  debut: Date;
  fin: Date;
};

type UpdateInput = {
  offreId?: number | null;
  prix?: string;
  debut?: Date;
  fin?: Date;
};

@Injectable()
export class AbonnementService {
  constructor(private readonly prisma: PrismaService) { }

  /** Retourne l'abonnement valide (fin >= now) le plus récent pour l'utilisateur, ou null. */
  async getByUserId(userId: number) {
    const now = new Date();
    const abonnement = await this.prisma.abonnement.findFirst({
      where: { userId, fin: { gte: now } },
      orderBy: { fin: 'desc' },
      include: { offre: true } as any,
    });
    if (!abonnement) return apiSuccess(null, '');
    return apiSuccess(abonnement, '');
  }

  async create(input: CreateInput) {
    const data: any = {
      user: { connect: { id: input.userId } },
      prix: input.prix,
      debut: input.debut,
      fin: input.fin,
    };
    if (input.offreId != null) {
      data.offre = { connect: { id: input.offreId } };
    }
    const abonnement = await this.prisma.abonnement.create({
      data,
    });
    return apiSuccess(abonnement, 'Abonnement enregistré');
  }

  /** Met à jour l'abonnement valide (fin >= now) le plus récent pour l'utilisateur. */
  async update(userId: number, input: UpdateInput) {
    const now = new Date();
    const exists = await this.prisma.abonnement.findFirst({
      where: { userId, fin: { gte: now } },
      orderBy: { fin: 'desc' },
    });
    if (!exists) throw new NotFoundException({ message: "Abonnement introuvable pour l'utilisateur" });
    const abonnement = await this.prisma.abonnement.update({
      where: { id: exists.id },
      data: {
        ...('offreId' in input ? { offreId: input.offreId } : {}),
        ...('prix' in input ? { prix: input.prix as any } : {}),
        ...('debut' in input ? { debut: input.debut } : {}),
        ...('fin' in input ? { fin: input.fin } : {}),
      },
    });
    return apiSuccess(abonnement, 'Abonnement mis à jour');
  }

  /** Supprime l'abonnement valide (fin >= now) le plus récent pour l'utilisateur. */
  async deleteByUserId(userId: number) {
    const now = new Date();
    const exists = await this.prisma.abonnement.findFirst({
      where: { userId, fin: { gte: now } },
      orderBy: { fin: 'desc' },
    });
    if (!exists) throw new NotFoundException({ message: "Abonnement introuvable pour l'utilisateur" });
    await this.prisma.abonnement.delete({ where: { id: exists.id } });
    return apiSuccess(null, 'Abonnement supprimé');
  }

  async findAll() {
    const abonnements = await this.prisma.abonnement.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            phone: true,
          },
        },
        // Le champ 'offre' existe bien dans le schéma Prisma mais peut ne pas
        // être encore présent dans les types générés. On caste donc en `any`
        // pour contourner l'erreur TypeScript tout en gardant l'include.
        offre: true,
      } as any,
      orderBy: { debut: 'desc' },
    });
    return apiSuccess(abonnements, '');
  }

  async getStatsByMonth() {
    // Récupérer les 12 derniers mois
    const now = new Date();
    const months: { month: string; amount: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const abonnements = await this.prisma.abonnement.findMany({
        where: {
          debut: {
            gte: start,
            lte: end,
          },
        },
      });

      const amount = abonnements.reduce((sum, abo) => {
        return sum + parseFloat(abo.prix.toString());
      }, 0);

      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      months.push({ month: monthLabel, amount });
    }

    return apiSuccess(months, '');
  }

  async getMostPopularOffre() {
    const abonnements = await this.prisma.abonnement.findMany({
      where: { offreId: { not: null } },
      include: { offre: true },
    } as any);

    if (abonnements.length === 0) {
      return apiSuccess({ offre: null, count: 0 }, '');
    }

    const countByOffreId: Record<number, number> = {};
    abonnements.forEach((raw) => {
      // Cast en any car les types Prisma générés ne connaissent pas encore `offreId`
      const abo = raw as any;
      if (abo.offreId != null) {
        countByOffreId[abo.offreId] = (countByOffreId[abo.offreId] || 0) + 1;
      }
    });

    const entries = Object.entries(countByOffreId).map(([id, count]) => ({
      offreId: Number(id),
      count,
    }));
    const mostPopular = entries.reduce((a, b) => (a.count > b.count ? a : b));

    // Cast en any car le type généré d'Abonnement ne contient pas encore `offreId`
    const match = abonnements.find((raw) => {
      const abo = raw as any;
      return abo.offreId === mostPopular.offreId;
    }) as any | undefined;
    const offre = match?.offre ?? null;

    return apiSuccess({ offre, count: mostPopular.count }, '');
  }
}


