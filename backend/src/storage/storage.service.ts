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
  /** Browser-accessible base URL, e.g. http://localhost:9000 */
  private publicUrl!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.bucket = this.configService.get<string>('minioBucket') ?? 'kyc-documents';
    const endpoint = this.configService.get<string>('minioEndpoint') ?? 'localhost';
    const port = this.configService.get<number>('minioPort') ?? 9000;

    this.client = new Minio.Client({
      endPoint: endpoint,
      port,
      accessKey: this.configService.get<string>('minioAccessKey') ?? 'minioadmin',
      secretKey: this.configService.get<string>('minioSecretKey') ?? 'minioadmin',
      useSSL: this.configService.get<boolean>('minioSecure') ?? false,
    });

    // The public URL is used to rewrite the internal hostname in presigned URLs.
    // MINIO_SERVER_URL must also be set on the MinIO container so MinIO accepts
    // signatures where the Host header is localhost:9000 instead of minio:9000.
    this.publicUrl = this.configService.get<string>('minioPublicUrl') ?? `http://${endpoint}:${port}`;
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
    // Generate using the internal client (minio:9000 — reachable from backend container).
    const internalUrl = await this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
    const parsed = new URL(internalUrl);
    const publicBase = new URL(this.publicUrl);
    parsed.protocol = publicBase.protocol;
    parsed.hostname = publicBase.hostname;
    parsed.port = publicBase.port;
    return parsed.toString();
  }

  async getObjectBase64(objectKey: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await this.client.getObject(this.bucket, objectKey);
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer.toString('base64'));
        });
        stream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }
}
