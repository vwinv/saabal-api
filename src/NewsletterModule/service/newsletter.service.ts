import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

type CreateInput = { 
  title: string; 
  content?: string; 
  filename: string;
  mime: string;
  size: number;
  url?: string;
  editeurId: number;
  categorieId: number;
  dateJournal?: Date;
};
type UpdateInput = { 
  id: number; 
  title?: string; 
  content?: string;
  filename?: string;
  mime?: string;
  size?: number;
  url?: string;
  editeurId?: number;
  categorieId?: number;
  dateJournal?: Date;
};

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateInput) {
    // Vérifier que l'éditeur existe
    const editeur = await this.prisma.editeur.findUnique({ where: { id: input.editeurId } });
    if (!editeur) {
      throw new BadRequestException(`Éditeur avec l'ID ${input.editeurId} introuvable`);
    }

    // Vérifier que la catégorie existe
    const categorie = await this.prisma.categorie.findUnique({ where: { id: input.categorieId } });
    if (!categorie) {
      throw new BadRequestException(`Catégorie avec l'ID ${input.categorieId} introuvable`);
    }

    const journal = await this.prisma.journal.create({
      data: {
        title: input.title,
        content: input.content,
        filename: input.filename,
        mime: input.mime,
        size: input.size,
        url: input.url,
        editeurId: input.editeurId,
        categorieId: input.categorieId,
        dateJournal: input.dateJournal ? new Date(input.dateJournal) : new Date(),
      },
      include: {
        editeur: true,
        categorie: true,
      },
    });

    return { data: journal, message: 'Journal créé avec succès' };
  }

  async update(input: UpdateInput) {
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.filename !== undefined) updateData.filename = input.filename;
    if (input.mime !== undefined) updateData.mime = input.mime;
    if (input.size !== undefined) updateData.size = input.size;
    if (input.url !== undefined) updateData.url = input.url;
    if (input.editeurId !== undefined) {
      const editeur = await this.prisma.editeur.findUnique({ where: { id: input.editeurId } });
      if (!editeur) {
        throw new BadRequestException(`Éditeur avec l'ID ${input.editeurId} introuvable`);
      }
      updateData.editeurId = input.editeurId;
    }
    if (input.categorieId !== undefined) {
      const categorie = await this.prisma.categorie.findUnique({ where: { id: input.categorieId } });
      if (!categorie) {
        throw new BadRequestException(`Catégorie avec l'ID ${input.categorieId} introuvable`);
      }
      updateData.categorieId = input.categorieId;
    }
    if (input.dateJournal !== undefined) updateData.dateJournal = new Date(input.dateJournal);

    const journal = await this.prisma.journal.update({
      where: { id: input.id },
      data: updateData,
      include: {
        editeur: true,
        categorie: true,
      },
    });

    return { data: journal, message: 'Journal modifié avec succès' };
  }

  async remove(id: number) {
    await this.prisma.journal.delete({ where: { id } });
    return { message: 'Journal supprimé avec succès' };
  }

  async findAll() {
    const items = await this.prisma.journal.findMany({
      include: {
        editeur: true,
        categorie: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: items };
  }

  async listByDay(date: string) {
    const day = new Date(date);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
    const items = await this.prisma.journal.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return { data: items };
  }

  async listByMonth(year: number, monthZeroBased: number) {
    const start = new Date(year, monthZeroBased, 1, 0, 0, 0, 0);
    const end = new Date(year, monthZeroBased + 1, 0, 23, 59, 59, 999);
    const items = await this.prisma.journal.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return { data: items };
  }

  async listByRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const items = await this.prisma.journal.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'desc' } });
    return { data: items };
  }
}


