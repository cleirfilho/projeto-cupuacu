import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@cupuacu.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha: string;
}
