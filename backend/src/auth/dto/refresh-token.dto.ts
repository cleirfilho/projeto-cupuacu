import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtido no login ou na renovação anterior',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
