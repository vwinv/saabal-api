import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateOrReplaceInput = {
  userId: number;
  type: string;
  prix: string; // using string to be compatible with Prisma Decimal
  debut: Date;
  fin: Date;
};

type UpdateInput = {
  type?: string;
  prix?: string;
  debut?: Date;
  fin?: Date;
};

@Injectable()
export class AbonnementService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: number) {
    const abonnement = await this.prisma.abonnement.findUnique({ where: { userId } });
    if (!abonnement) return { data: null, message: '' };
    return { data: abonnement, message: '' };
  }

  async createOrReplace(input: CreateOrReplaceInput) {
    // Enforce one-to-one by upserting on unique userId
    const abonnement = await this.prisma.abonnement.upsert({
      where: { userId: input.userId },
      update: {
        type: input.type,
        prix: input.prix as any,
        debut: input.debut,
        fin: input.fin,
      },
      create: {
        userId: input.userId,
        type: input.type,
        prix: input.prix as any,
        debut: input.debut,
        fin: input.fin,
      },
    });
    return { data: abonnement, message: 'Abonnement enregistré' };
  }

  async update(userId: number, input: UpdateInput) {
    const exists = await this.prisma.abonnement.findUnique({ where: { userId } });
    if (!exists) throw new NotFoundException({ message: "Abonnement introuvable pour l'utilisateur" });
    const abonnement = await this.prisma.abonnement.update({
      where: { userId },
      data: {
        ...('type' in input ? { type: input.type } : {}),
        ...('prix' in input ? { prix: input.prix as any } : {}),
        ...('debut' in input ? { debut: input.debut } : {}),
        ...('fin' in input ? { fin: input.fin } : {}),
      },
    });
    return { data: abonnement, message: 'Abonnement mis à jour' };
  }

  async deleteByUserId(userId: number) {
    const exists = await this.prisma.abonnement.findUnique({ where: { userId } });
    if (!exists) throw new NotFoundException({ message: "Abonnement introuvable pour l'utilisateur" });
    await this.prisma.abonnement.delete({ where: { userId } });
    return { message: 'Abonnement supprimé' };
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
      },
      orderBy: { debut: 'desc' },
    });
    return { data: abonnements, message: '' };
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
    
    return { data: months };
  }

  async getMostPopularType() {
    const abonnements = await this.prisma.abonnement.findMany();
    
    if (abonnements.length === 0) {
      return { data: { type: 'Aucun', count: 0 } };
    }
    
    const typeCount: Record<string, number> = {};
    abonnements.forEach(abo => {
      typeCount[abo.type] = (typeCount[abo.type] || 0) + 1;
    });
    
    const entries = Object.entries(typeCount);
    const mostPopular = entries.reduce((a, b) => 
      a[1] > b[1] ? a : b
    );
    
    return { data: { type: mostPopular[0] || 'Aucun', count: mostPopular[1] || 0 } };
  }
}


