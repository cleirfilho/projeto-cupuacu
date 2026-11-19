import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { ContactService } from './contact.service';

jest.mock('nodemailer');

describe('ContactService', () => {
  const sendMail = jest.fn();
  const contact = {
    nome: 'Maria',
    email: 'maria@example.com',
    telefone: '91999999999',
    mensagem: 'Quero conhecer os serviços.',
  };
  const settings = {
    SMTP_HOST: 'smtp.example.com',
    SMTP_USER: 'site@example.com',
    SMTP_PASS: 'test-password',
    CONTACT_FROM: 'site@example.com',
    CONTACT_TO: 'contato@example.com',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(createTransport)
      .mockReturnValue({ sendMail } as unknown as ReturnType<
        typeof createTransport
      >);
  });

  it('envia ao destinatário configurado e direciona a resposta ao visitante', async () => {
    const service = new ContactService(new ConfigService(settings));

    await service.send(contact);

    expect(sendMail).toHaveBeenCalledWith({
      from: settings.CONTACT_FROM,
      to: settings.CONTACT_TO,
      replyTo: { name: '', address: contact.email },
      subject: 'Nova mensagem do formulário de contato',
      text: `Nome: Maria\nE-mail: maria@example.com\nTelefone: 91999999999\n\n${contact.mensagem}`,
    });
  });

  it('reporta indisponibilidade quando o servidor SMTP rejeita o envio', async () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    sendMail.mockRejectedValue(
      Object.assign(new Error('Resposta SMTP com dados privados'), {
        code: 'EMESSAGE',
        responseCode: 550,
      }),
    );
    const service = new ContactService(new ConfigService(settings));

    try {
      await expect(service.send(contact)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(log).toHaveBeenCalledWith(
        'Falha no envio SMTP da mensagem de contato (código EMESSAGE, status 550).',
      );
    } finally {
      log.mockRestore();
    }
  });

  it('reporta indisponibilidade quando falta configuração SMTP', async () => {
    const service = new ContactService(new ConfigService({ SMTP_HOST: '' }));

    await expect(service.send(contact)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(createTransport).not.toHaveBeenCalled();
  });
});
