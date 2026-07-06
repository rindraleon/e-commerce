import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface ProductNotificationPayload {
  productName: string;
  productUrl: string;
  productDescription?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail =
      this.configService.get<string>('MAIL_FROM') || 'no-reply@eshop.local';

    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn(
        'SMTP configuration is missing. Emails will be logged instead of sent.',
      );
    }
  }

  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    if (!this.transporter) {
      this.logger.log(`Email fallback -> ${options.to}: ${options.subject}`);
      return { delivered: false, reason: 'smtp_not_configured' };
    }

    await this.transporter.sendMail({
      from: this.fromEmail,
      ...options,
    });
    return { delivered: true };
  }

  async sendWelcomeEmail(to: string, fullName?: string) {
    const name = fullName || 'client';
    return this.sendMail({
      to,
      subject: 'Bienvenue sur E-shop Pro',
      text: `Bonjour ${name}, votre compte E-shop Pro a bien été créé.`,
      html: `<p>Bonjour <strong>${name}</strong>,</p><p>Votre compte <strong>E-shop Pro</strong> a bien été créé.</p><p>Merci pour votre inscription.</p>`,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    fullName?: string,
  ) {
    const name = fullName || 'client';
    return this.sendMail({
      to,
      subject: 'Réinitialisation de votre mot de passe',
      text: `Bonjour ${name}, utilisez ce lien pour réinitialiser votre mot de passe: ${resetLink}`,
      html: `<p>Bonjour <strong>${name}</strong>,</p><p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p><p><a href="${resetLink}">${resetLink}</a></p><p>Ce lien expirera bientôt.</p>`,
    });
  }

  async sendNewProductNotification(
    to: string,
    payload: ProductNotificationPayload,
  ) {
    return this.sendMail({
      to,
      subject: `Nouveau produit disponible : ${payload.productName}`,
      text: `Un nouveau produit est disponible sur E-shop Pro : ${payload.productName}. ${payload.productDescription || ''} Voir: ${payload.productUrl}`,
      html: `<p>Un nouveau produit est disponible sur <strong>E-shop Pro</strong> :</p><p><strong>${payload.productName}</strong></p><p>${payload.productDescription || ''}</p><p><a href="${payload.productUrl}">Voir le produit</a></p>`,
    });
  }
}
