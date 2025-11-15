import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    var list = await this.prisma.user.findMany();
    return { data: list, message : "" };
  }

  async create(data: { email: string; password: string; firstname?: string, lastname?: string, role?: string , phone? : string}) {
    const hashed = await bcrypt.hash(data.password, 10);
    data.password = hashed;
    const user = await this.prisma.user.findFirst({ where: { email: data.email } });
    if (user != null) throw new UnauthorizedException({message : "Emain existe deja"});
    var newuser = this.prisma.user.create({ data });
    return { data: newuser, message : "Utilisateur cree avec succes" };
  }

  async findOne(id: number) {
    var user = await this.prisma.user.findUnique({ where: { id } });
    return { data: {user : user}, message : "" };
  }

  async updateBlock(data:{id: number, activated: boolean}) {
    console.log(data.activated);
    var user =  await this.prisma.user.update({ where: { id: data.id }, data: data });
    return { data: user, message : "Utilisateur bloque avec succes" };
  }

  async update(data: { id: number, email?: string, firstname?: string, lastname?: string, role?: string , phone? : string}) {
    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.firstname !== undefined) updateData.firstname = data.firstname;
    if (data.lastname !== undefined) updateData.lastname = data.lastname;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.phone !== undefined) updateData.phone = data.phone;
    
    var user = await this.prisma.user.update({ where: { id: data.id }, data: updateData });
    return { data: user, message : "utilisateur modifie avec succes" };
  }

  async updatePass(data: { id: number, password?: string}) {
    const hashed = await bcrypt.hash(data.password, 10);
    data.password = hashed;
    await this.prisma.user.update({ where: { id: data.id}, data:data });
    return {message : "Mot de passe modifie avec succes" };
  }

  async remove(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Utilisateur supprimé avec succès' };
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
    
    return { data: months };
  }
}


