import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';
import { apiSuccess } from '../../common/api-response.js';

const PDF_FOLDER = 'saabal/journaux';

type CreateInput = {
  title: string;
  grosTitre?: string;
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
  grosTitre?: string;
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async getUserContext(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, editeurId: true },
    });
    if (!user) {
      throw new ForbiddenException('Utilisateur introuvable');
    }
    return user;
  }

  async createWithPdf(
    input: {
      title: string;
      grosTitre?: string;
      editeurId: number;
      categorieId: number;
      dateJournal?: string;
    },
    pdf: { buffer: Buffer; mimetype: string; originalname?: string; size?: number },
    currentUserId: number,
  ) {
    const uploadResult = await this.cloudinary.uploadBuffer(
      { buffer: pdf.buffer, mimetype: pdf.mimetype, originalname: pdf.originalname },
      PDF_FOLDER,
      'raw',
    );
    const content = uploadResult.secure_url;
    return this.create(
      {
        title: input.title,
        grosTitre: input.grosTitre,
        content,
        filename: pdf.originalname || 'journal.pdf',
        mime: pdf.mimetype || 'application/pdf',
        size: pdf.size || 0,
        editeurId: input.editeurId,
        categorieId: input.categorieId,
        dateJournal: input.dateJournal ? new Date(input.dateJournal) : undefined,
      },
      currentUserId,
    );
  }

  async updateWithPdf(
    id: number,
    updateData: UpdateInput,
    pdf: { buffer: Buffer; mimetype: string; originalname?: string; size?: number },
    currentUserId: number,
  ) {
    const uploadResult = await this.cloudinary.uploadBuffer(
      { buffer: pdf.buffer, mimetype: pdf.mimetype, originalname: pdf.originalname },
      PDF_FOLDER,
      'raw',
    );
    updateData.content = uploadResult.secure_url;
    updateData.filename = pdf.originalname || 'journal.pdf';
    updateData.mime = pdf.mimetype || 'application/pdf';
    updateData.size = pdf.size || 0;
    return this.update({ ...updateData, id }, currentUserId);
  }

  async create(input: CreateInput, currentUserId: number) {
    const user = await this.getUserContext(currentUserId);

    // Si ADMIN, il ne peut créer que pour son propre éditeur
    if (user.role === 'ADMIN' || user.role === 'admin') {
      if (!user.editeurId) {
        throw new ForbiddenException('Aucun éditeur associé à cet administrateur');
      }
      input.editeurId = user.editeurId;
    }
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
        grosTitre: input.grosTitre,
        content: input.content,
        filename: input.filename,
        mime: input.mime,
        size: input.size,
        url: input.url,
        editeurId: input.editeurId,
        categorieId: input.categorieId,
        dateJournal: input.dateJournal ? new Date(input.dateJournal) : new Date(),
      } as any,
      include: {
        editeur: true,
        categorie: true,
      },
    });

    return apiSuccess(journal, 'Journal créé avec succès');
  }

  async update(input: UpdateInput, currentUserId: number) {
    const user = await this.getUserContext(currentUserId);
    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.grosTitre !== undefined) updateData.grosTitre = input.grosTitre;
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

    // Si ADMIN, s'assurer que le journal lui appartient
    if (user.role === 'ADMIN' || user.role === 'admin') {
      if (!user.editeurId) {
        throw new ForbiddenException('Aucun éditeur associé à cet administrateur');
      }
      const existing = await this.prisma.journal.findFirst({
        where: { id: input.id, editeurId: user.editeurId },
      });
      if (!existing) {
        throw new ForbiddenException('Vous ne pouvez modifier que les journaux de votre éditeur');
      }
      updateData.editeurId = user.editeurId;
    }

    const journal = await this.prisma.journal.update({
      where: { id: input.id },
      data: updateData,
      include: {
        editeur: true,
        categorie: true,
      },
    });

    return apiSuccess(journal, 'Journal modifié avec succès');
  }

  async remove(id: number, currentUserId: number) {
    const user = await this.getUserContext(currentUserId);

    const where: any = { id };
    if (user.role === 'ADMIN' || user.role === 'admin') {
      if (!user.editeurId) {
        throw new ForbiddenException('Aucun éditeur associé à cet administrateur');
      }
      where.editeurId = user.editeurId;
    }

    const existing = await this.prisma.journal.findFirst({ where });
    if (!existing) {
      throw new ForbiddenException('Journal introuvable ou non autorisé');
    }

    await this.prisma.journal.delete({ where: { id: existing.id } });
    return apiSuccess(null, 'Journal supprimé avec succès');
  }

  async findAll(currentUserId: number) {
    const user = await this.getUserContext(currentUserId);

    const where: any = {};
    if (user.role === 'ADMIN' || user.role === 'admin') {
      if (!user.editeurId) {
        throw new ForbiddenException('Aucun éditeur associé à cet administrateur');
      }
      where.editeurId = user.editeurId;
    }

    const items = await this.prisma.journal.findMany({
      where,
      include: {
        editeur: true,
        categorie: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(items, '');
  }

  /** Liste tous les journaux, sans authentification (route publique). */
  async findAllPublic() {
    const items = await this.prisma.journal.findMany({
      include: { editeur: true, categorie: true },
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(items, '');
  }

  async listByDay(date: string, currentUserId: number) {
    const user = await this.getUserContext(currentUserId);
    const day = new Date(date);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
    const where: any = { dateJournal: { gte: start, lte: end } };
    if (user.role === 'ADMIN' || user.role === 'admin') {
      if (!user.editeurId) {
        throw new ForbiddenException('Aucun éditeur associé à cet administrateur');
      }
      where.editeurId = user.editeurId;
    }
    const items = await this.prisma.journal.findMany({ where, orderBy: { dateJournal: 'desc' } });
    return apiSuccess(items, '');
  }

  /** Liste des journaux pour une date donnée (filtre sur dateJournal), sans authentification. */
  async listByDayPublic(date: string) {
    const day = new Date(date);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
    const items = await this.prisma.journal.findMany({
      where: { dateJournal: { gte: start, lte: end } },
      include: { editeur: true, categorie: true },
      orderBy: { dateJournal: 'desc' },
    });
    return apiSuccess(items, '');
  }

  async listByMonth(year: number, monthZeroBased: number, currentUserId: number) {
    const user = await this.getUserContext(currentUserId);
    const start = new Date(year, monthZeroBased, 1, 0, 0, 0, 0);
    const end = new Date(year, monthZeroBased + 1, 0, 23, 59, 59, 999);
    const where: any = { dateJournal: { gte: start, lte: end } };
    if (user.role === 'ADMIN' || user.role === 'admin') {
      if (!user.editeurId) {
        throw new ForbiddenException('Aucun éditeur associé à cet administrateur');
      }
      where.editeurId = user.editeurId;
    }
    const items = await this.prisma.journal.findMany({ where, orderBy: { dateJournal: 'desc' } });
    return apiSuccess(items, '');
  }

  /** Liste des journaux pour un mois donné (filtre sur dateJournal), sans authentification. */
  async listByMonthPublic(year: number, monthZeroBased: number) {
    const start = new Date(year, monthZeroBased, 1, 0, 0, 0, 0);
    const end = new Date(year, monthZeroBased + 1, 0, 23, 59, 59, 999);
    const items = await this.prisma.journal.findMany({
      where: { dateJournal: { gte: start, lte: end } },
      include: { editeur: true, categorie: true },
      orderBy: { dateJournal: 'desc' },
    });
    return apiSuccess(items, '');
  }

  async listByRange(startIso: string, endIso: string, currentUserId: number) {
    const user = await this.getUserContext(currentUserId);
    const start = new Date(startIso);
    const end = new Date(endIso);
    const where: any = { dateJournal: { gte: start, lte: end } };
    if (user.role === 'ADMIN' || user.role === 'admin') {
      if (!user.editeurId) {
        throw new ForbiddenException('Aucun éditeur associé à cet administrateur');
      }
      where.editeurId = user.editeurId;
    }
    const items = await this.prisma.journal.findMany({ where, orderBy: { dateJournal: 'desc' } });
    return apiSuccess(items, '');
  }

  /** Liste des journaux sur une plage de dates (filtre sur dateJournal), sans authentification. */
  async listByRangePublic(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const items = await this.prisma.journal.findMany({
      where: { dateJournal: { gte: start, lte: end } },
      include: { editeur: true, categorie: true },
      orderBy: { dateJournal: 'desc' },
    });
    return apiSuccess(items, '');
  }

  /** Liste des journaux par catégorie, sans authentification (route publique). */
  async listByCategoriePublic(categorieId: number) {

    if (categorieId == 0) {
      const items = await this.prisma.journal.findMany({
        include: { editeur: true, categorie: true },
        orderBy: { dateJournal: 'desc' },
      });
      return apiSuccess(items, '');
    } else {
      const items = await this.prisma.journal.findMany({
        where: { categorieId },
        include: { editeur: true, categorie: true },
        orderBy: { dateJournal: 'desc' },
      });
      return apiSuccess(items, '');
    }
  }
}


