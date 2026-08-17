import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

import { AiVerificationResponse } from './interfaces/ai-verification-response.interface';

@Injectable()
export class AiEngineClient {
  private readonly logger = new Logger(AiEngineClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async verify(input: {
    customerId: string;
    documentType: string;
    declaredDocumentNumber?: string;
    document: Express.Multer.File;
    selfie: Express.Multer.File;
  }): Promise<AiVerificationResponse> {
    const form = new FormData();
    form.append('customer_id', input.customerId);
    form.append('document_type', input.documentType);
    if (input.declaredDocumentNumber) {
      form.append('declared_document_number', input.declaredDocumentNumber);
    }
    form.append('document_file', input.document.buffer, {
      filename: input.document.originalname,
      contentType: input.document.mimetype,
    });
    form.append('selfie_file', input.selfie.buffer, {
      filename: input.selfie.originalname,
      contentType: input.selfie.mimetype,
    });

    return this._post(form, 'Document verification', '/api/v1/verify');
  }

  /**
   * NIN Biometric path — sends the enrolled JPEG photo decoded from the mock NIN API
   * as raw bytes directly to the AI engine (no OCR, face + liveness only).
   */
  async verifyFromBytes(input: {
    customerId: string;
    photoBuffer: Buffer;
    selfieFile: Express.Multer.File;
  }): Promise<AiVerificationResponse> {
    const form = new FormData();
    form.append('customer_id', input.customerId);
    form.append('document_type', 'NIN_BIOMETRIC');
    form.append('document_file', input.photoBuffer, {
      filename: 'nin-photo.jpg',
      contentType: 'image/jpeg',
    });
    form.append('selfie_file', input.selfieFile.buffer, {
      filename: input.selfieFile.originalname,
      contentType: input.selfieFile.mimetype,
    });

    return this._post(form, 'NIN biometric verification', '/api/v1/verify-from-bytes');
  }

  private async _post(form: FormData, label: string, endpoint: string): Promise<AiVerificationResponse> {
    const url = `${this.configService.get<string>('aiEngineUrl')}${endpoint}`;
    this.logger.log(`${label}: ${url}`);
    try {
      const response = await firstValueFrom(
        this.httpService.post<AiVerificationResponse>(url, form, {
          headers: {
            ...form.getHeaders(),
            'x-api-key': this.configService.get<string>('aiEngineApiKey'),
          },
          maxBodyLength: Infinity,
          timeout: 120_000,
        }),
      );
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const detail = JSON.stringify(error?.response?.data ?? error?.message ?? error);
      this.logger.error(`AI Engine call failed [HTTP ${status ?? 'N/A'}]: ${detail}`);
      throw new ServiceUnavailableException(`AI Verification Engine error: ${detail}`);
    }
  }
}
