import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { randomUUID } from "crypto";
import { Role } from "../common/enums/role.enum";
import { TipoPessoa } from "../common/enums/tipo-pessoa.enum";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uuid: string;

  @Column({ type: "simple-enum", enum: TipoPessoa })
  tipoPessoa: TipoPessoa;

  @Column({ type: "varchar", nullable: true })
  nome: string | null;

  @Column({ type: "varchar", nullable: true })
  nomeFantasia: string | null;

  @Column({ type: "varchar", nullable: true })
  razaoSocial: string | null;

  @Column({ type: "varchar", nullable: true, unique: true })
  cpf: string | null;

  @Column({ type: "varchar", nullable: true, unique: true })
  cnpj: string | null;

  @Column({ unique: true })
  email: string;

  @Column({ type: "varchar", nullable: true })
  telefone: string | null;

  @Column({ type: "varchar", nullable: true })
  celular: string | null;

  @Column({ select: false })
  senha: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: "simple-enum", enum: Role, default: Role.USUARIO })
  role: Role;

  @Column({ type: "datetime", nullable: true })
  ultimoLogin: Date | null;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @BeforeInsert()
  createUuid() {
    this.uuid ||= randomUUID();
  }
}
