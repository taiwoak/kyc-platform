import { HttpService } from '@nestjs/axios';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { firstValueFrom } from 'rxjs';

import { AiVerificationResponse } from './interfaces/ai-verification-response.interface';

@Injectable()
export class AiEngineClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async verify(input: {
    customerId: string;
    documentType: string;
    document: Express.Multer.File;
    selfie: Express.Multer.File;
  }): Promise<AiVerificationResponse> {
    const form = new FormData();
    form.append('customer_id', input.customerId);
    form.append('document_type', input.documentType);
    form.append('document_file', input.document.buffer, {
      filename: input.document.originalname,
      contentType: input.document.mimetype,
    });
    form.append('selfie_file', input.selfie.buffer, {
      filename: input.selfie.originalname,
      contentType: input.selfie.mimetype,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post<AiVerificationResponse>(
          `${this.configService.get<string>('aiEngineUrl')}/api/v1/verify`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              'x-api-key': this.configService.get<string>('aiEngineApiKey'),
            },
            maxBodyLength: Infinity,
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException('AI Verification Engine is unavailable');
    }
  }
}
