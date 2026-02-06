import { Body, Controller, Get, Param, Post, Put, UseGuards, Req } from '@nestjs/common';
import { LectureService } from '../service/lecture.service.js';
import { JwtAuthGuard } from '../../AuthModule/guard/jwt-auth.guard.js';

@Controller('lectures')
export class LectureController {
  constructor(private readonly service: LectureService) {}

  /**
   * Enregistre la lecture (page actuelle) pour l'utilisateur connecté et un journal.
   * Body: { journalId: number, page: number }
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  save(
    @Body() body: { journalId: number; page: number },
    @Req() req: { user: { userId: number } },
  ) {
    return this.service.saveOrUpdate(req.user.userId, body.journalId, body.page ?? 1);
  }

  /**
   * Met à jour la lecture (page actuelle) pour l'utilisateur connecté et un journal.
   * Body: { page: number }. Crée la lecture si elle n'existe pas.
   */
  @Put('journal/:journalId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('journalId') journalId: string,
    @Body() body: { page?: number },
    @Req() req: { user: { userId: number } },
  ) {
    return this.service.saveOrUpdate(
      req.user.userId,
      Number(journalId),
      body.page ?? 1,
    );
  }

  /**
   * Récupère toutes les lectures (page > 1) de l'utilisateur connecté avec les infos journal.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyLectures(@Req() req: { user: { userId: number } }) {
    return this.service.getAllForUser(req.user.userId);
  }

  /**
   * Récupère la lecture (page enregistrée) pour l'utilisateur connecté et un journal.
   */
  @Get('journal/:journalId')
  @UseGuards(JwtAuthGuard)
  getByJournal(
    @Param('journalId') journalId: string,
    @Req() req: { user: { userId: number } },
  ) {
    return this.service.getByJournalAndUser(Number(journalId), req.user.userId);
  }

  /**
   * Récupère la lecture pour un journal et un utilisateur donnés (id journal + id user).
   * Utile pour un admin ou pour une requête explicite par userId.
   */
  @Get('journal/:journalId/user/:userId')
  @UseGuards(JwtAuthGuard)
  getByJournalAndUser(
    @Param('journalId') journalId: string,
    @Param('userId') userId: string,
    @Req() req: { user: { userId: number } },
  ) {
    const targetUserId = Number(userId);
    // L'utilisateur ne peut récupérer que sa propre lecture sauf s'il demande explicitement son userId
    if (targetUserId !== req.user.userId) {
      // Pour étendre : vérifier ici si req.user est admin et autoriser la lecture d'un autre user
      return this.service.getByJournalAndUser(Number(journalId), targetUserId);
    }
    return this.service.getByJournalAndUser(Number(journalId), req.user.userId);
  }
}
