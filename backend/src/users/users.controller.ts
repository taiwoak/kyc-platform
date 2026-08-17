import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';

import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserStatus } from './entities/user.entity';
import { UsersService } from './users.service';

class UpdateUserStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status!: UserStatus;
}

class UpdateUserRoleDto {
  @IsIn([UserRole.Admin, UserRole.VerificationOfficer, UserRole.Customer])
  role!: UserRole;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.Admin)
  listUsers() {
    return this.usersService.list();
  }

  @Patch(':id/status')
  @Roles(UserRole.Admin)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto.status);
  }

  @Patch(':id/role')
  @Roles(UserRole.Admin)
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }
}
