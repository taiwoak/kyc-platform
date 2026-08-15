import { Injectable, NotFoundException } from '@nestjs/common';

import { UserRole } from '../common/enums/user-role.enum';
import { UserEntity, UserStatus } from './entities/user.entity';
import { UsersRepository } from './users.repository';

export type PublicUser = Omit<UserEntity, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(input: { fullName: string; email: string; passwordHash: string; role?: UserRole }): Promise<PublicUser> {
    const user = await this.usersRepository.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.Customer,
    });
    return this.toPublicUser(user);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findById(id);
  }

  async list(): Promise<PublicUser[]> {
    const users = await this.usersRepository.list();
    return users.map((u) => this.toPublicUser(u));
  }

  async updateStatus(id: string, status: UserStatus): Promise<PublicUser> {
    const user = await this.usersRepository.updateStatus(id, status);
    if (!user) throw new NotFoundException('User not found');
    return this.toPublicUser(user);
  }

  async seed(email: string, passwordHash: string, fullName: string, role: UserRole): Promise<PublicUser> {
    const user = await this.usersRepository.ensureSeed(email, passwordHash, fullName, role);
    return this.toPublicUser(user);
  }

  toPublicUser(user: UserEntity): PublicUser {
    const { passwordHash: _ph, ...pub } = user;
    return pub;
  }
}
