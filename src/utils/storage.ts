import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

export class StorageService {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.bucket = Deno.env.get('R2_BUCKET_NAME') || 'recipe-app';
    this.endpoint = `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      endPoint: this.endpoint,
      port: 443,
      useSSL: true,
      region: 'auto',
      bucket: this.bucket,
      accessKey: Deno.env.get('R2_ACCESS_KEY_ID') || '',
      secretKey: Deno.env.get('R2_SECRET_ACCESS_KEY') || '',
      pathStyle: true,
    });
  }

  async uploadFile(file: Uint8Array, key: string, contentType: string): Promise<string> {
    await this.client.putObject(key, file, {
      metadata: {
        "content-type": contentType
      }
    });
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.deleteObject(key);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return await this.client.presignedGetObject(key, {
      expirySeconds: expiresIn
    });
  }
}

// Create a singleton instance
export const storageService = new StorageService();
