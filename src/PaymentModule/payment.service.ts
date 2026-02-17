import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { apiSuccess } from '../common/api-response.js';
import { createHash } from 'crypto';

type CheckoutInput = {
  userId: number;
  offreId: number;
};

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Initialise un paiement PayTech pour une offre donnée.
   * - Lit l'offre (prix) en base
   * - Appelle l'API PayTech /payment/request-payment
   * - Retourne le token et l'URL de redirection au front
   */
  async createPaytechCheckout(input: CheckoutInput) {
    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    // Cast en any car les types Prisma générés ne connaissent pas encore le modèle Offre
    const offre = await (this.prisma as any).offre.findUnique({ where: { id: input.offreId } });
    if (!offre) {
      throw new BadRequestException('Offre introuvable');
    }

    const amount = parseFloat(offre.prix.toString());
    if (Number.isNaN(amount) || amount <= 0) {
      throw new BadRequestException("Prix d'offre invalide");
    }

    const apiKey = process.env.PAYTECH_API_KEY;
    const apiSecret = process.env.PAYTECH_API_SECRET;
    const env = process.env.PAYTECH_ENV || 'test'; // doc: env=test ou prod
    const ipnUrl = process.env.PAYTECH_IPN_URL;
    const successUrl = process.env.PAYTECH_SUCCESS_URL;
    const cancelUrl = process.env.PAYTECH_CANCEL_URL;

    if (!apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Configuration PayTech manquante (PAYTECH_API_KEY / PAYTECH_API_SECRET)',
      );
    }

    const body = {
      item_name: offre.nom,
      item_price: amount,
      currency: 'XOF',
      ref_command: `ABO_${user.id}_${Date.now()}`, // doc: ref_command => référence unique
      command_name: `Abonnement ${offre.nom}`,
      env, // "test" ou "prod" (doc)
      ipn_url: ipnUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // doc: custom_field renvoyé tel quel dans l'IPN
      custom_field: JSON.stringify({
        user_id: user.id,
        offre_id: offre.id,
      }),
    };
    console.log("body: ", body);

    const response = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        API_KEY: apiKey,
        API_SECRET: apiSecret,
      },
      body: JSON.stringify(body),
    });

    const data: any = await response.json().catch(() => null);

    if (!data || (data.success !== 1 && data.success !== true)) {
      throw new InternalServerErrorException(
        data?.message || 'Erreur de communication avec PayTech',
      );
    }

    const redirectUrl = data.redirect_url || data.redirectUrl;

    return apiSuccess(
      {
        token: data.token,
        redirect_url: redirectUrl,
      },
      'Paiement PayTech initialisé',
    );
  }

  /**
   * IPN / webhook PayTech.
   * Basé sur l'exemple "Payment success Notification" de la collection Postman.
   * Vérifie les hash SHA-256 et crée un abonnement si type_event = "sale_complete".
   */
  async handlePaytechIpn(body: any) {
    const apiKey = process.env.PAYTECH_API_KEY;
    const apiSecret = process.env.PAYTECH_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Configuration PayTech manquante (PAYTECH_API_KEY / PAYTECH_API_SECRET)',
      );
    }

    // Vérification des hash api_key_sha256 / api_secret_sha256 (doc Postman)
    const expectedKeyHash = createHash('sha256').update(apiKey).digest('hex');
    const expectedSecretHash = createHash('sha256').update(apiSecret).digest('hex');

    if (
      body.api_key_sha256 !== expectedKeyHash ||
      body.api_secret_sha256 !== expectedSecretHash
    ) {
      throw new BadRequestException('Signature PayTech invalide');
    }

    const typeEvent = body.type_event;
    if (typeEvent !== 'sale_complete') {
      // Événements non traités (par exemple autres types_event)
      return apiSuccess({ handled: true, type_event: typeEvent }, 'Événement ignoré');
    }

    // custom_field est renvoyé tel quel (doc) : on y met user_id et offre_id
    let custom: any = {};
    if (body.custom_field) {
      try {
        custom = JSON.parse(body.custom_field);
      } catch {
        custom = {};
      }
    }

    const userId = Number(custom.user_id);
    const offreId = Number(custom.offre_id);

    if (!userId || !offreId) {
      throw new BadRequestException('custom_field invalide dans IPN PayTech');
    }

    // Cast en any pour accéder au modèle Offre tant que les types Prisma ne sont pas régénérés
    const offre = await (this.prisma as any).offre.findUnique({ where: { id: offreId } });
    if (!offre) {
      throw new BadRequestException("Offre introuvable pour l'IPN PayTech");
    }

    // Exemple: abonnement de 30 jours à partir de maintenant (logique métier locale)
    const now = new Date();
    const fin = new Date(now);
    fin.setDate(fin.getDate() + 30);

    // Schéma actuel: un user peut avoir plusieurs abonnements (historique).
    await (this.prisma as any).abonnement.create({
      data: {
        userId,
        offreId: offre.id,
        prix: offre.prix,
        debut: now,
        fin,
      } as any,
    });

    return apiSuccess({ handled: true, type_event: typeEvent }, 'Abonnement créé via PayTech');
  }
}

