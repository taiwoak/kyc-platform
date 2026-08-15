import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuid } from 'uuid';

export interface StoredObject {
  objectKey: string;
  bucket: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client!: Minio.Client;
  private bucket!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.bucket = this.configService.get<string>('minioBucket') ?? 'kyc-documents';
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('minioEndpoint') ?? 'localhost',
      port: this.configService.get<number>('minioPort') ?? 9000,
      accessKey: this.configService.get<string>('minioAccessKey') ?? 'minioadmin',
      secretKey: this.configService.get<string>('minioSecretKey') ?? 'minioadmin',
      useSSL: this.configService.get<boolean>('minioSecure') ?? false,
    });
    void this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created MinIO bucket: ${this.bucket}`);
      }
    } catch (err) {
      this.logger.warn(`Could not ensure MinIO bucket: ${err}`);
    }
  }

  async upload(folder: string, file: Express.Multer.File): Promise<StoredObject> {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `${folder}/${uuid()}-${safeName}`;
    try {
      await this.client.putObject(
        this.bucket,
        objectKey,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );
      this.logger.log(`Uploaded ${objectKey} to MinIO bucket ${this.bucket}`);
    } catch (err) {
      this.logger.error(`MinIO upload failed for ${objectKey}: ${err}`);
      throw err;
    }
    return {
      objectKey,
      bucket: this.bucket,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async getPresignedUrl(objectKey: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
  }
}
