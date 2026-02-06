import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DocumentKind } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';
import { MailService } from '../../mail/mail.service.js';
import { apiSuccess } from '../../common/api-response.js';

type CreateInput = { nom: string; adminEmail: string };
type UpdateInput = { id: number; nom?: string };

@Injectable()
export class EditorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly mail: MailService,
  ) { }

  /**
   * Génère des identifiants d'admin pour un éditeur donné.
   * L'email est basé sur le nom de l'éditeur + son id (ajouté plus tard),
   * le mot de passe est une chaîne aléatoire.
   */
  private generateAdminPassword(): string {
    // Mot de passe simple et lisible, 10 caractères alphanumériques
    return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
  }

  /**
   * Crée un éditeur (avec logo éventuel) et un utilisateur ADMIN associé.
   * Retourne l'éditeur et l'admin, et envoie les identifiants par email.
   */
  private async createEditorAndAdmin(nom: string, adminEmail: string, logo?: any) {
    const plainPassword = this.generateAdminPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Créer l'éditeur
      const editeur = await tx.editeur.create({ data: { nom } });

      // 2. Gérer le logo si présent (upload Cloudinary)
      if (logo) {
        const folder =
          process.env.CLOUDINARY_FOLDER_LOGOS ||
          `${process.env.CLOUDINARY_FOLDER_BASE || 'saabal'}/logos`;

        const uploadResult = await this.cloudinary.uploadBuffer(logo, folder);
        const url = uploadResult.secure_url;

        await tx.document.create({
          data: {
            kind: DocumentKind.EDITEUR_LOGO,
            filename: logo.originalname || uploadResult.original_filename || 'logo',
            mime: logo.mimetype || 'image/png',
            size: logo.size ?? uploadResult.bytes ?? 0,
            url,
            editeurId: editeur.id,
          },
        });
      }

      // 3. Créer l'admin associé à cet éditeur avec l'email fourni
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstname: 'Admin',
          lastname: nom,
          role: 'ADMIN',
          activated: true,
          // @ts-ignore - champ ajouté dans Prisma, le client doit être régénéré
          editeurId: editeur.id,
        },
      });

      return { editeur, admin, adminEmail, adminPassword: plainPassword };
    });

    // Envoi de l'email avec les identifiants (désactivé pour le moment, conservé pour plus tard)
    /*
    try {
      await this.mail.sendEditorAdminCredentials(
        result.adminEmail,
        nom,
        result.adminEmail,
        result.adminPassword,
      );
    } catch (e) {
      // On ne bloque pas la création si l'envoi d'email échoue
      // eslint-disable-next-line no-console
      console.error('Erreur lors de l’envoi de l’email d’admin éditeur :', e);
    }
    */

    return apiSuccess(
      {
        editeur: result.editeur,
        admin: {
          id: result.admin.id,
          email: result.adminEmail,
        },
      },
      `Editeur créé avec succès. Un compte ADMIN a été créé pour cet éditeur.\nEmail: ${result.adminEmail}\nMot de passe: ${result.adminPassword}\n⚠️ Pensez à changer ce mot de passe après la première connexion.`,
    );
  }

  async create(input: CreateInput) {
    // Création simple (sans logo) + création automatique d'un admin
    return this.createEditorAndAdmin(input.nom, input.adminEmail);
  }

  async createWithLogo(nom: string, adminEmail: string, logo?: any) {
    // Création avec logo + création automatique d'un admin
    return this.createEditorAndAdmin(nom, adminEmail, logo);
  }

  async update(input: UpdateInput) {
    const item = await this.prisma.editeur.update({ where: { id: input.id }, data: { nom: input.nom } });
    return apiSuccess(item, 'Editeur modifié');
  }

  async remove(id: number) {
    // On récupère d'abord l'éditeur
    const editeur = await this.prisma.editeur.findUnique({
      where: { id },
    });

    if (!editeur) {
      return apiSuccess(null, 'Editeur introuvable (déjà supprimé)');
    }

    // Documents logos liés à cet éditeur
    const logoDocs = await this.prisma.document.findMany({
      where: {
        editeurId: id,
        kind: DocumentKind.EDITEUR_LOGO,
      },
    });

    // Utilisateurs admins liés à cet éditeur
    const adminUsers = await this.prisma.user.findMany({
      where: {
        // @ts-ignore - champ ajouté dans Prisma, le client doit être régénéré
        editeurId: id,
        role: { in: ['ADMIN', 'admin'] },
      },
    });

    // Suppression en base dans une transaction
    await this.prisma.$transaction(async (tx) => {
      if (adminUsers.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: { in: adminUsers.map((u) => u.id) },
          },
        });
      }

      if (logoDocs.length > 0) {
        await tx.document.deleteMany({
          where: {
            id: { in: logoDocs.map((d) => d.id) },
          },
        });
      }

      await tx.editeur.delete({ where: { id } });
    });

    // Suppression réelle des logos sur Cloudinary (après la transaction)
    for (const doc of logoDocs) {
      await this.cloudinary.deleteByUrl(doc.url!);
    }

    return apiSuccess(null, 'Editeur, admin associé et logo supprimés avec succès');
  }

  async listByDay(date: string) {
    const day = new Date(date);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
    const items = await this.prisma.editeur.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return apiSuccess(items, '');
  }

  async listByMonth(year: number, monthZeroBased: number) {
    const start = new Date(year, monthZeroBased, 1, 0, 0, 0, 0);
    const end = new Date(year, monthZeroBased + 1, 0, 23, 59, 59, 999);
    const items = await this.prisma.editeur.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return apiSuccess(items, '');
  }

  async listByRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const items = await this.prisma.editeur.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return apiSuccess(items, '');
  }

  async findAll() {
    const items = await this.prisma.editeur.findMany({
      include: { documents: true },
      orderBy: { createdAt: 'desc' }
    });
    return apiSuccess(items, '');
  }
}


