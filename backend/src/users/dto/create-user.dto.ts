import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';
import { TipoPessoa } from '../../common/enums/tipo-pessoa.enum';

export class CreateUserDto {
  @ApiProperty({ enum: TipoPessoa, example: TipoPessoa.FISICA })
  @IsEnum(TipoPessoa)
  tipoPessoa: TipoPessoa;

  @ApiPropertyOptional({
    example: 'Maria da Silva',
    description: 'Obrigatório para pessoa física',
  })
  @ValidateIf((dto: CreateUserDto) => dto.tipoPessoa === TipoPessoa.FISICA)
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @ApiPropertyOptional({ example: 'Kupuassu Contabilidade' })
  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @ApiPropertyOptional({
    example: 'Kupuassu Contabilidade Ltda.',
    description: 'Obrigatório para pessoa jurídica',
  })
  @ValidateIf((dto: CreateUserDto) => dto.tipoPessoa === TipoPessoa.JURIDICA)
  @IsString()
  @IsNotEmpty()
  razaoSocial?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ example: '12345678000190' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '1133334444' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ example: '11999998888' })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ enum: Role, default: Role.USUARIO })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
