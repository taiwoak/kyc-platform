export default () => ({
  port: Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-development',
  uploadsPath: process.env.UPLOADS_PATH ?? './storage/local',
  aiEngineUrl: process.env.AI_ENGINE_URL ?? 'http://127.0.0.1:8000',
  aiEngineApiKey: process.env.AI_ENGINE_API_KEY ?? 'local-ai-engine-key',
  // PostgreSQL
  postgresHost: process.env.POSTGRES_HOST ?? 'localhost',
  postgresPort: Number(process.env.POSTGRES_PORT ?? 5432),
  postgresDb: process.env.POSTGRES_DB ?? 'kyc_platform',
  postgresUser: process.env.POSTGRES_USER ?? 'kyc_user',
  postgresPassword: process.env.POSTGRES_PASSWORD ?? 'kyc_password',
  // MinIO
  minioEndpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  minioPort: Number(process.env.MINIO_PORT ?? 9000),
  minioAccessKey: process.env.MINIO_ROOT_USER ?? 'minioadmin',
  minioSecretKey: process.env.MINIO_ROOT_PASSWORD ?? 'minioadmin',
  minioBucket: process.env.MINIO_BUCKET ?? 'kyc-documents',
  minioSecure: process.env.MINIO_SECURE === 'true',
  // The browser-accessible URL for MinIO presigned URLs (replaces internal Docker hostname)
  minioPublicUrl: process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000',
});
