import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateVerificationDto {
  @IsIn(['NIN_SLIP', 'DRIVERS_LICENSE', 'PVC', 'PASSPORT'])
  documentType!: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;
}
