import { Injectable, Logger } from '@nestjs/common';

import * as nodemailer from 'nodemailer';
import { envs } from 'src/config';

@Injectable()
export class MailService {

  private readonly logger = new Logger(MailService.name);

  private transporter: nodemailer.Transporter;

  constructor() {
    // Logs para verificar que las variables llegan
    this.logger.log('MAIL_USER: ' + envs.mailUser);
    this.logger.log('MAIL_PASS: ' + (envs.mailPass ? '[REDACTED]' : 'undefined'));
    this.logger.log('MAIL_HOST: ' + envs.mailHost);
    this.logger.log('MAIL_PORT: ' + envs.mailPort);

    this.transporter = nodemailer.createTransport({
      host: envs.mailHost,
      port: envs.mailPort,
      secure: false, // true for 465, false for 587
      auth: {
        user: envs.mailUser,
        pass: envs.mailPass,
      },
    });
  }

    async sendConfirmationEmail(to: string, confirmLink: string) {
    try {
    await this.transporter.sendMail({
      from: '"Your App" <${envs.mailUser}>',
      to,
      subject: 'Confirm Your Account',
      html: `
        <h2>Welcome to Your App!</h2>
        <p>Please confirm your account by clicking the link below:</p>
        <a href="${confirmLink}">Confirm Account</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  } catch (error) {
    this.logger.error('Error sending confirmation email:', error);
    throw new Error('Failed to send confirmation email');
  }
  }

}