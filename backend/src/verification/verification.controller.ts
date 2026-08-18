import { Body, Controller, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { VerificationService } from './verification.service';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

class UpdateVerificationStatusDto {
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;
}

export class CreateNinVerificationDto {
  @IsString()
  @IsNotEmpty()
  nin!: string;
}

@Controller('verification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('requests')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'document', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
      ],
      { limits: { fileSize: 8 * 1024 * 1024 } },
    ),
  )
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVerificationDto,
    @UploadedFiles()
    files: {
      document?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    return this.verificationService.submit({
      userId: user.sub,
      dto,
      document: files.document?.[0],
      selfie: files.selfie?.[0],
    });
  }

  @Post('nin-verify')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'selfie', maxCount: 1 }],
      { limits: { fileSize: 8 * 1024 * 1024 } },
    ),
  )
  submitNinVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNinVerificationDto,
    @UploadedFiles()
    files: {
      selfie?: Express.Multer.File[];
    },
  ) {
    if (!files.selfie?.[0]) {
      throw new Error('Selfie is required');
    }
    return this.verificationService.submitNinVerification({
      userId: user.sub,
      nin: dto.nin,
      selfie: files.selfie[0],
    });
  }

  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.verificationService.historyForUser(user.sub);
  }

  @Get('reviews')
  @Roles(UserRole.VerificationOfficer, UserRole.Admin)
  reviews() {
    return this.verificationService.manualReviewQueue();
  }

  @Get('all')
  @Roles(UserRole.VerificationOfficer, UserRole.Admin)
  all() {
    return this.verificationService.all();
  }

  @Patch(':id/status')
  @Roles(UserRole.VerificationOfficer, UserRole.Admin)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVerificationStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.verificationService.updateStatus(id, dto.status, user.sub);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.verificationService.getRecordById(id, user.sub, user.role);
  }

  @Get(':id/images')
  getImages(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.verificationService.getImageUrls(id, user.sub, user.role);
  }
}
