import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    if (!requiredRoles) {
      return true; // Pas de restriction de rôle
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Récupérer l'utilisateur depuis la base de données pour obtenir son rôle
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('Utilisateur introuvable');
    }

    const hasRole = requiredRoles.some((role) => dbUser.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException('Accès refusé : permissions insuffisantes');
    }

    return true;
  }
}

