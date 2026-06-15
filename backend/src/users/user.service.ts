import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { TipoPessoa } from '../common/enums/tipo-pessoa.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UserService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  async create(createUserDto: CreateUserDto) {
    await this.ensureUniqueFields(createUserDto);

    const user = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.trim().toLowerCase(),
      cpf: this.optionalValue(createUserDto.cpf),
      cnpj: this.optionalValue(createUserDto.cnpj),
      senha: await bcrypt.hash(createUserDto.senha, 12),
      role: createUserDto.role ?? Role.USUARIO,
      ativo: createUserDto.ativo ?? true,
    });

    const savedUser = await this.userRepository.save(user);
    return this.findById(savedUser.id);
  }

  findAll() {
    return this.userRepository.find({
      order: {
        criadoEm: 'DESC',
      },
    });
  }

  async findById(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findActiveById(id: number) {
    const user = await this.userRepository.findOneBy({ id, ativo: true });
    if (!user) {
      throw new NotFoundException('Usuário ativo não encontrado');
    }
    return user;
  }

  findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.senha')
      .where('LOWER(user.email) = LOWER(:email)', { email: email.trim() })
      .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    await this.ensureUniqueFields(updateUserDto, id);

    const update = {
      ...updateUserDto,
      email: updateUserDto.email?.trim().toLowerCase(),
      cpf:
        updateUserDto.cpf === undefined
          ? undefined
          : this.optionalValue(updateUserDto.cpf),
      cnpj:
        updateUserDto.cnpj === undefined
          ? undefined
          : this.optionalValue(updateUserDto.cnpj),
      senha: updateUserDto.senha
        ? await bcrypt.hash(updateUserDto.senha, 12)
        : undefined,
    };

    Object.assign(
      user,
      Object.fromEntries(
        Object.entries(update).filter(([, value]) => value !== undefined),
      ),
    );
    await this.userRepository.save(user);
    return this.findById(user.id);
  }

  async remove(id: number) {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async updateLastLogin(id: number) {
    await this.userRepository.update(id, { ultimoLogin: new Date() });
  }

  private async seedAdmin() {
    const email = 'admin@cupuacu.local';
    const existingAdmin = await this.userRepository.findOneBy({ email });
    if (existingAdmin) {
      return;
    }

    const admin = this.userRepository.create({
      tipoPessoa: TipoPessoa.FISICA,
      nome: 'Administrador',
      email,
      senha: await bcrypt.hash('Admin@123', 12),
      role: Role.ADMIN,
      ativo: true,
    });
    await this.userRepository.save(admin);
  }

  private async ensureUniqueFields(
    dto: Partial<CreateUserDto>,
    currentUserId?: number,
  ) {
    const fields: Array<keyof Pick<CreateUserDto, 'email' | 'cpf' | 'cnpj'>> = [
      'email',
      'cpf',
      'cnpj',
    ];

    for (const field of fields) {
      const rawValue = dto[field];
      const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
      if (!value) {
        continue;
      }

      const normalizedValue = field === 'email' ? value.toLowerCase() : value;
      const where = {
        [field]: normalizedValue,
        ...(currentUserId ? { id: Not(currentUserId) } : {}),
      } as FindOptionsWhere<User>;
      const existingUser = await this.userRepository.findOneBy(where);

      if (existingUser) {
        throw new ConflictException(`${field.toUpperCase()} já cadastrado`);
      }
    }
  }

  private optionalValue(value?: string) {
    return value?.trim() || null;
  }
}
