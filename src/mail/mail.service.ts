import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.MAIL_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT ?? 587),
        secure: process.env.MAIL_SECURE === 'true',
        auth:
          process.env.MAIL_USER && process.env.MAIL_PASS
            ? {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
              }
            : undefined,
      });
    }
  }

  private ensureTransporter() {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Configuration email manquante (MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS).',
      );
    }
  }

  async sendEditorAdminCredentials(
    to: string,
    editorName: string,
    adminEmail: string,
    adminPassword: string,
  ) {
    this.ensureTransporter();

    const from = process.env.MAIL_FROM || process.env.MAIL_USER;
    const appUrl = process.env.ADMIN_APP_URL || 'https://saabal.com/admin';

    await this.transporter!.sendMail({
      from,
      to,
      subject: `Vos accès administrateur pour l'éditeur ${editorName}`,
      text: `
Bonjour,

Un compte administrateur a été créé pour vous sur la plateforme Saabal pour l'éditeur "${editorName}".

Identifiants de connexion :
- Email : ${adminEmail}
- Mot de passe : ${adminPassword}

Vous pouvez vous connecter à l'interface d'administration à l'adresse suivante :
${appUrl}

Pensez à changer votre mot de passe après la première connexion.

Bien cordialement,
L'équipe Saabal
      `.trim(),
      html: `
        <p>Bonjour,</p>
        <p>Un compte administrateur a été créé pour vous sur la plateforme <strong>Saabal</strong> pour l'éditeur <strong>${editorName}</strong>.</p>
        <p><strong>Identifiants de connexion :</strong></p>
        <ul>
          <li><strong>Email :</strong> ${adminEmail}</li>
          <li><strong>Mot de passe :</strong> ${adminPassword}</li>
        </ul>
        <p>Vous pouvez vous connecter à l'interface d'administration à l'adresse suivante :</p>
        <p><a href="${appUrl}" target="_blank" rel="noopener noreferrer">${appUrl}</a></p>
        <p><em>Pensez à changer votre mot de passe après la première connexion.</em></p>
        <p>Bien cordialement,<br>L'équipe Saabal</p>
      `,
    });
  }
}

