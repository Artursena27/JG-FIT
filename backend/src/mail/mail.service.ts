import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(MailService.name);
  private readonly mailFrom: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.mailFrom = this.config.get<string>('MAIL_FROM') || 'onboarding@resend.dev';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY ausente. E-mails não serão enviados de verdade, apenas logados.');
    }
  }

  async sendAwaitingApproval(toEmail: string) {
    if (!this.resend) {
      this.logger.log(`[FAKE EMAIL] Aguardando aprovação -> Para: ${toEmail}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.mailFrom,
        to: toEmail,
        subject: 'Recebemos sua solicitação - JG-FIT',
        html: `
          <h3>Olá!</h3>
          <p>Sua conta foi criada e está <strong>aguardando aprovação</strong> do seu personal.</p>
          <p>Assim que liberado, você receberá outro e-mail para preencher sua anamnese completa e começar seus treinos.</p>
        `,
      });
      this.logger.log(`E-mail "Aguardando Aprovação" enviado para ${toEmail}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail de aguardando aprovação:', error);
    }
  }

  async sendApproved(toEmail: string) {
    if (!this.resend) {
      this.logger.log(`[FAKE EMAIL] Aprovado! -> Para: ${toEmail}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.mailFrom,
        to: toEmail,
        subject: 'Sua conta foi aprovada! - JG-FIT',
        html: `
          <h3>Boas notícias!</h3>
          <p>Sua conta foi <strong>aprovada</strong>.</p>
          <p>Acesse a plataforma para preencher seu onboarding e liberar sua primeira ficha de treino.</p>
        `,
      });
      this.logger.log(`E-mail "Aprovado" enviado para ${toEmail}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail de aprovação:', error);
    }
  }
}
