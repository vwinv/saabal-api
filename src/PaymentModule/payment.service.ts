import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { apiSuccess } from '../common/api-response.js';

type CheckoutInput = {
  userId: number;
  offreId: number;
};

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialise un paiement PayDunya pour une offre donnée.
   * - Lit l'offre (prix) en base
   * - Construit une facture PayDunya
   * - Retourne l'URL de paiement et les métadonnées utiles au front
   */
  async createCheckout(input: CheckoutInput) {
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new BadRequestException("Utilisateur introuvable");
    }

    // Cast en any car les types Prisma générés ne connaissent pas encore le modèle Offre
    const offre = await (this.prisma as any).offre.findUnique({ where: { id: input.offreId } });
    if (!offre) {
      throw new BadRequestException("Offre introuvable");
    }

    const amount = parseFloat(offre.prix.toString());
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException("Prix d'offre invalide");
    }

    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    const token = process.env.PAYDUNYA_TOKEN;
    const callbackUrl = process.env.PAYDUNYA_CALLBACK_URL;

    if (!masterKey || !privateKey || !token) {
      throw new InternalServerErrorException(
        'Configuration PayDunya manquante (PAYDUNYA_MASTER_KEY / PAYDUNYA_PRIVATE_KEY / PAYDUNYA_TOKEN)',
      );
    }

    const payload = {
      invoice: {
        items: [
          {
            name: offre.nom,
            quantity: 1,
            unit_price: amount,
            total_price: amount,
          },
        ],
        total_amount: amount,
        description: offre.description || `Abonnement ${offre.nom}`,
      },
      store: {
        name: 'Saabal',
        // Optionnel: phone, website_url, logo_url, etc.
      },
      actions: {
        callback_url: callbackUrl,
      },
      custom_data: {
        user_id: user.id,
        offre_id: offre.id,
      },
    };

    const response = await fetch('https://app.paydunya.com/api/v1/dmp-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': masterKey,
        'PAYDUNYA-PRIVATE-KEY': privateKey,
        'PAYDUNYA-TOKEN': token,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      throw new InternalServerErrorException('Erreur de communication avec PayDunya');
    }

    // La structure exacte de la réponse dépend de la configuration PayDunya.
    // On renvoie les champs principaux (token, url) tels que retournés.
    return apiSuccess(
      {
        raw: data,
      },
      'Paiement initialisé',
    );
  }

  /**
   * Callback / webhook PayDunya.
   * Ici on vérifie le statut du paiement et on crée / met à jour l'abonnement.
   * La structure exacte du body dépend de la configuration PayDunya.
   */
  async handleCallback(body: any) {
    try {
      const custom = body?.data?.custom_data || body?.custom_data || {};
      const userId = Number(custom.user_id);
      const offreId = Number(custom.offre_id);

      const status = body?.status || body?.data?.status;
      if (!userId || !offreId || !status) {
        throw new BadRequestException('Données de callback incomplètes');
      }

      // On ne crée l’abonnement que si le paiement est confirmé
      if (status !== 'completed' && status !== 'success' && status !== 'completed') {
        return apiSuccess({ handled: true, status }, 'Paiement non confirmé');
      }

      // Cast en any pour accéder au modèle Offre tant que les types Prisma ne sont pas régénérés
      const offre = await (this.prisma as any).offre.findUnique({ where: { id: offreId } });
      if (!offre) {
        throw new BadRequestException("Offre introuvable pour le callback");
      }

      // Exemple: abonnement de 30 jours à partir de maintenant
      const now = new Date();
      const fin = new Date(now);
      fin.setDate(fin.getDate() + 30);

      // Upsert pour garantir un seul abonnement par user
      await (this.prisma as any).abonnement.upsert({
        where: { userId },
        update: {
          offreId: offre.id,
          prix: offre.prix,
          debut: now,
          fin,
        } as any,
        create: {
          userId,
          offreId: offre.id,
          prix: offre.prix,
          debut: now,
          fin,
        } as any,
      });

      return apiSuccess({ handled: true, status }, 'Abonnement mis à jour');
    } catch (e: any) {
      throw new InternalServerErrorException(e?.message || 'Erreur traitement callback PayDunya');
    }
  }
}

