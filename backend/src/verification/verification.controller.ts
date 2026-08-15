import { Body, Controller, Get, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { VerificationService } from './verification.service';

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

  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.verificationService.historyForUser(user.sub);
  }

  @Get('reviews')
  @Roles(UserRole.VerificationOfficer, UserRole.ComplianceOfficer, UserRole.Admin)
  reviews() {
    return this.verificationService.manualReviewQueue();
  }

  @Get('all')
  @Roles(UserRole.Admin)
  all() {
    return this.verificationService.all();
  }
}
