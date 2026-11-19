import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContactDto } from './contact.dto';
import { ContactService } from './contact.service';

@ApiTags('Contato')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Mensagem aceita pelo servidor SMTP.' })
  @ApiBadRequestResponse({ description: 'Dados do formulário inválidos.' })
  @ApiServiceUnavailableResponse({
    description: 'Envio temporariamente indisponível.',
  })
  send(@Body() contact: ContactDto): Promise<void> {
    return this.contactService.send(contact);
  }
}
