import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { apiSuccess } from '../../common/api-response.js';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.user.findMany();
    return apiSuccess(list, '');
  }

  async create(data: { email: string; password: string; firstname?: string, lastname?: string, role?: string , phone? : string}) {
    const hashed = await bcrypt.hash(data.password, 10);
    data.password = hashed;
    const user = await this.prisma.user.findFirst({ where: { email: data.email } });
    if (user != null) throw new UnauthorizedException({message : "Emain existe deja"});
    const newuser = await this.prisma.user.create({ data });
    return apiSuccess(newuser, 'Utilisateur créé avec succès');
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return apiSuccess({ user }, '');
  }

  async updateBlock(data: { id: number; activated: boolean }, currentUserId: number) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true },
    });
    if (!currentUser) throw new UnauthorizedException('Utilisateur introuvable');

    const isAdmin = ['SUPER_ADMIN', 'super-admin'].includes(currentUser.role ?? '');
    if (!isAdmin) {
      // Un client ne peut modifier que son propre compte et uniquement désactiver
      if (data.id !== currentUserId) {
        throw new UnauthorizedException('Vous ne pouvez modifier que votre propre compte');
      }
      if (data.activated === true) {
        throw new UnauthorizedException('Un client ne peut pas réactiver son compte');
      }
    }

    const user = await this.prisma.user.update({ where: { id: data.id }, data });
    return apiSuccess(user, data.activated ? 'Compte activé avec succès' : 'Compte désactivé avec succès');
  }

  async update(data: { id: number, email?: string, firstname?: string, lastname?: string, role?: string , phone? : string}) {
    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.firstname !== undefined) updateData.firstname = data.firstname;
    if (data.lastname !== undefined) updateData.lastname = data.lastname;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.phone !== undefined) updateData.phone = data.phone;
    
    const user = await this.prisma.user.update({ where: { id: data.id }, data: updateData });
    return apiSuccess(user, 'Utilisateur modifié avec succès');
  }

  async updatePass(data: { id: number, password?: string}) {
    const hashed = await bcrypt.hash(data.password!, 10);
    await this.prisma.user.update({ where: { id: data.id }, data: { password: hashed } });
    return apiSuccess(null, 'Mot de passe modifié avec succès');
  }

  async remove(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return apiSuccess(null, 'Utilisateur supprimé avec succès');
  }

  async getStatsByMonth() {
    // Récupérer les 12 derniers mois
    const now = new Date();
    const months: { month: string; count: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const count = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });
      
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      months.push({ month: monthLabel, count });
    }
    
    return apiSuccess(months, '');
  }
}


