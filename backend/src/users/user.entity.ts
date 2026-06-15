import { randomUUID } from 'crypto';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { TipoPessoa } from '../common/enums/tipo-pessoa.enum';

@Entity({ name: 'users' })
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ format: 'uuid' })
  @Column({ unique: true })
  uuid: string;

  @ApiProperty({ enum: TipoPessoa })
  @Column({ type: 'simple-enum', enum: TipoPessoa })
  tipoPessoa: TipoPessoa;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  nome: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  nomeFantasia: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  razaoSocial: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'varchar', nullable: true, unique: true })
  cpf: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'varchar', nullable: true, unique: true })
  cnpj: string | null;

  @ApiProperty({ example: 'maria@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  telefone: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  celular: string | null;

  @ApiHideProperty()
  @Column({ select: false })
  senha: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  ativo: boolean;

  @ApiProperty({ enum: Role })
  @Column({ type: 'simple-enum', enum: Role, default: Role.USUARIO })
  role: Role;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @Column({ type: 'datetime', nullable: true })
  ultimoLogin: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn()
  criadoEm: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn()
  atualizadoEm: Date;

  @BeforeInsert()
  createUuid() {
    this.uuid ||= randomUUID();
  }
}
