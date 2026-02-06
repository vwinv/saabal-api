import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { apiSuccess } from '../../common/api-response.js';

@Injectable()
export class LectureService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre ou met à jour la lecture d'un utilisateur pour un journal (page actuelle).
   */
  async saveOrUpdate(userId: number, journalId: number, page: number) {
    if (page < 1) {
      throw new BadRequestException('La page doit être >= 1');
    }
    const journal = await this.prisma.journal.findUnique({
      where: { id: journalId },
    });
    if (!journal) {
      throw new BadRequestException(`Journal avec l'ID ${journalId} introuvable`);
    }
    const lecture = await this.prisma.lecture.upsert({
      where: {
        userId_journalId: { userId, journalId },
      },
      create: { userId, journalId, page },
      update: { page },
    });
    return apiSuccess(lecture, 'Lecture enregistrée');
  }

  /**
   * Récupère la lecture d'un utilisateur pour un journal donné.
   */
  async getByJournalAndUser(journalId: number, userId: number) {
    const lecture = await this.prisma.lecture.findUnique({
      where: {
        userId_journalId: { userId, journalId },
      },
    });
    return apiSuccess(lecture ?? { page: 1, journalId, userId }, '');
  }

  /**
   * Récupère toutes les lectures de l'utilisateur (page > 1) avec le journal (editeur, categorie).
   */
  async getAllForUser(userId: number) {
    const lectures = await this.prisma.lecture.findMany({
      where: { userId, page: { gt: 1 } },
      orderBy: { updatedAt: 'desc' },
      include: {
        journal: {
          include: {
            editeur: true,
            categorie: true,
          },
        },
      },
    });
    const data = lectures.map((l) => ({
      page: l.page,
      journalId: l.journalId,
      journal: l.journal
        ? {
            id: l.journal.id,
            title: l.journal.title,
            content: l.journal.content,
            url: l.journal.url,
            filename: l.journal.filename,
            dateJournal: l.journal.dateJournal,
            grosTitre: l.journal.grosTitre,
            editeur: l.journal.editeur
              ? { id: l.journal.editeur.id, nom: l.journal.editeur.nom }
              : null,
            categorie: l.journal.categorie
              ? { id: l.journal.categorie.id, name: l.journal.categorie.name }
              : null,
          }
        : null,
    }));
    return apiSuccess(data, '');
  }
}
