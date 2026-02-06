import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { apiSuccess } from '../../common/api-response.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(body: {
    email: string;
    password: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new ConflictException('Un compte existe déjà avec cet email.');
    const hashed = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
        firstname: body.firstname ?? null,
        lastname: body.lastname ?? null,
        phone: body.phone ?? null,
      },
    });
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });
    return apiSuccess(
      {
        user: { id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname, phone: user.phone, role: user.role },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      'Inscription réussie',
    );
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user == null) throw new UnauthorizedException('Email ou mot de passe incorrect');

    // Compte bloqué (activated = false)
    if (user.activated === false) {
      throw new UnauthorizedException('Ce compte n\'existe plus');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    // Récupérer le dernier abonnement valide de l'utilisateur
    const now = new Date();
    const abonnement = await this.prisma.abonnement.findFirst({
      where: {
        userId: user.id,
        fin: {
          gte: now, // Date de fin >= maintenant (abonnement valide)
        },
      },
      orderBy: {
        fin: 'desc', // Le plus récent
      },
    });

    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    return apiSuccess(
      {
        user,
        abonnement: abonnement || null,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      'Login Successfull',
    );
  }

  /**
   * Permet à un utilisateur authentifié de désactiver son propre compte (activated = false).
   */
  async deactivateMyAccount(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { activated: false },
    });
    return apiSuccess(null, 'Compte désactivé avec succès');
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const newAccessToken = await this.jwtService.signAsync(
        { sub: payload.sub, email: payload.email },
        {
          expiresIn: '5m',
          secret: process.env.JWT_SECRET,
        },
      );

      return apiSuccess({ access_token: newAccessToken }, '');
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}


