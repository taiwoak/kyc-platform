import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRole } from '../common/enums/user-role.enum';
import { UserEntity, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async create(input: Omit<UserEntity, 'id' | 'createdAt' | 'status'> & { status?: UserStatus }): Promise<UserEntity> {
    const user = this.repo.create({
      ...input,
      email: input.email.toLowerCase(),
      status: input.status ?? 'ACTIVE',
    });
    return this.repo.save(user);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  list(): Promise<UserEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserEntity | null> {
    await this.repo.update(id, { status });
    return this.findById(id);
  }

  async updateRole(id: string, role: UserRole): Promise<UserEntity | null> {
    await this.repo.update(id, { role });
    return this.findById(id);
  }

  async ensureSeed(email: string, passwordHash: string, fullName: string, role: UserRole): Promise<UserEntity> {
    const existing = await this.findByEmail(email);
    if (existing) return existing;
    return this.create({ email, passwordHash, fullName, role });
  }
}
