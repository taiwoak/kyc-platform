import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    await this.usersService.seed('admin@kyc.local', passwordHash, 'System Administrator', UserRole.Admin);
    await this.usersService.seed('officer@kyc.local', passwordHash, 'KYC Verification Officer', UserRole.VerificationOfficer);
    await this.usersService.seed('customer@kyc.local', passwordHash, 'Demo Customer', UserRole.Customer);
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.Customer,
    });
    return {
      user,
      accessToken: await this.signToken(user.id, user.email, user.role),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      user: this.usersService.toPublicUser(user),
      accessToken: await this.signToken(user.id, user.email, user.role),
    };
  }

  private signToken(sub: string, email: string, role: UserRole): Promise<string> {
    return this.jwtService.signAsync(
      { sub, email, role },
      { secret: this.configService.get<string>('jwtSecret'), expiresIn: '8h' },
    );
  }
}
