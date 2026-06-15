import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";
import { Role } from "../../common/enums/role.enum";
import { TipoPessoa } from "../../common/enums/tipo-pessoa.enum";

export class CreateUserDto {
  @IsEnum(TipoPessoa)
  tipoPessoa: TipoPessoa;

  @ValidateIf((dto: CreateUserDto) => dto.tipoPessoa === TipoPessoa.FISICA)
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @ValidateIf((dto: CreateUserDto) => dto.tipoPessoa === TipoPessoa.JURIDICA)
  @IsString()
  @IsNotEmpty()
  razaoSocial?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
