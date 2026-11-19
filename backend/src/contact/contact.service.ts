import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { ContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly config: ConfigService) {}

  async send(contact: ContactDto): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const from = this.config.get<string>('CONTACT_FROM');
    const to = this.config.get<string>('CONTACT_TO');

    if (
      !host ||
      !user ||
      !pass ||
      !from ||
      !to ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      this.logger.error('Configuração SMTP do contato incompleta ou inválida.');
      throw new ServiceUnavailableException('Envio de contato indisponível.');
    }

    const transport = createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    try {
      await transport.sendMail({
        from,
        to,
        replyTo: { name: '', address: contact.email },
        subject: 'Nova mensagem do formulário de contato',
        text: [
          `Nome: ${contact.nome}`,
          `E-mail: ${contact.email}`,
          `Telefone: ${contact.telefone}`,
          '',
          contact.mensagem,
        ].join('\n'),
      });
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? error.code
          : undefined;
      const responseCode =
        error && typeof error === 'object' && 'responseCode' in error
          ? error.responseCode
          : undefined;
      const smtpCode =
        typeof code === 'string' && /^E[A-Z0-9_]{1,24}$/.test(code)
          ? code
          : 'desconhecido';
      const smtpStatus =
        typeof responseCode === 'number' && Number.isInteger(responseCode)
          ? responseCode
          : 'sem resposta';
      this.logger.error(
        `Falha no envio SMTP da mensagem de contato (código ${smtpCode}, status ${smtpStatus}).`,
      );
      throw new ServiceUnavailableException('Envio de contato indisponível.');
    }
  }
}
