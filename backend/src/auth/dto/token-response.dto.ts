import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT usado na autenticação Bearer' })
  accessToken: string;

  @ApiProperty({ description: 'JWT usado para renovar a sessão' })
  refreshToken: string;
}
