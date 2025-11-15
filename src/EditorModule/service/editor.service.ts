import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DocumentKind } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

type CreateInput = { nom: string };
type UpdateInput = { id: number; nom?: string };

@Injectable()
export class EditorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateInput) {
    const item = await this.prisma.editeur.create({ data: { nom: input.nom } });
    return { data: item, message: 'Editeur créé' };
  }

  async createWithLogo(nom: string, logo?: any) {
    // Créer l'éditeur
    const editeur = await this.prisma.editeur.create({ data: { nom } });

    // Si un logo est fourni, le sauvegarder et créer le document
    if (logo) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos');
      
      // Créer le dossier s'il n'existe pas
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const originalName = logo.originalname || 'logo';
      const ext = originalName.includes('.') ? originalName.split('.').pop() : 'png';
      const filename = `logo_${editeur.id}_${timestamp}.${ext}`;
      const filepath = join(uploadsDir, filename);

      // Sauvegarder le fichier (multer stocke en mémoire par défaut)
      if (!logo.buffer) {
        throw new Error('Le fichier n\'a pas pu être lu');
      }
      await writeFile(filepath, logo.buffer);

      // Créer l'entrée Document dans la base
      const url = `/uploads/logos/${filename}`;
      await this.prisma.document.create({
        data: {
          kind: DocumentKind.EDITEUR_LOGO,
          filename: logo.originalname || filename,
          mime: logo.mimetype || 'image/png',
          size: logo.size,
          url,
          editeurId: editeur.id,
        },
      });
    }

    return { data: editeur, message: 'Editeur créé avec logo' };
  }

  async update(input: UpdateInput) {
    const item = await this.prisma.editeur.update({ where: { id: input.id }, data: { nom: input.nom } });
    return { data: item, message: 'Editeur modifié' };
  }

  async remove(id: number) {
    await this.prisma.editeur.delete({ where: { id } });
    return { message: 'Editeur supprimé' };
  }

  async listByDay(date: string) {
    const day = new Date(date);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
    const items = await this.prisma.editeur.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return { data: items };
  }

  async listByMonth(year: number, monthZeroBased: number) {
    const start = new Date(year, monthZeroBased, 1, 0, 0, 0, 0);
    const end = new Date(year, monthZeroBased + 1, 0, 23, 59, 59, 999);
    const items = await this.prisma.editeur.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return { data: items };
  }

  async listByRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const items = await this.prisma.editeur.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return { data: items };
  }

  async findAll() {
    const items = await this.prisma.editeur.findMany({ 
      include: { documents: true },
      orderBy: { createdAt: 'desc' } 
    });
    return { data: items };
  }
}


