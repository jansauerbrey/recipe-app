import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

class StorageService {
  private client?: S3Client;
  private bucket?: string;
  private endpoint?: string;
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;

    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    if (!accountId) {
      throw new Error('R2_ACCOUNT_ID environment variable is required');
    }

    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME environment variable is required');
    }
    this.bucket = bucketName;

    const accessKey = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    if (!accessKey || !secretKey) {
      throw new Error('R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables are required');
    }

    const baseEndpoint = `${accountId}.r2.cloudflarestorage.com`;
    this.endpoint = `https://${baseEndpoint}/${bucketName}`;
    
    console.log('Initializing S3 client with config:', {
      endPoint: baseEndpoint,
      bucket: bucketName,
      region: 'auto',
      useSSL: true
    });
    
    this.client = new S3Client({
      endPoint: baseEndpoint,
      port: 443,
      useSSL: true,
      region: 'auto',
      bucket: this.bucket,
      accessKey,
      secretKey,
    });

    this.initialized = true;
  }

  async uploadFile(file: Uint8Array, key: string, contentType: string): Promise<string> {
    await this.initialize();
    if (!this.client || !this.endpoint || !this.bucket) {
      throw new Error('Storage service not properly initialized');
    }
    // Store with content type in metadata
    await this.client.putObject(key, file, {
      metadata: {
        "content-type": contentType
      }
    });
    return key; // Return the same key that was passed in
  }

  async deleteFile(key: string): Promise<void> {
    await this.initialize();
    if (!this.client) {
      throw new Error('Storage service not properly initialized');
    }
    await this.client.deleteObject(key);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    await this.initialize();
    if (!this.client) {
      throw new Error('Storage service not properly initialized');
    }
    return await this.client.presignedGetObject(key, {
      expirySeconds: expiresIn
    });
  }

  async getObject(key: string): Promise<{ data: Uint8Array; contentType?: string }> {
    await this.initialize();
    if (!this.client) {
      throw new Error('Storage service not properly initialized');
    }
    
    try {
      const response = await this.client.getObject(key);
      if (!response.body) {
        throw new Error('No data received from storage');
      }

      // Convert the stream to Uint8Array
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine all chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const data = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }

      // Get content type from headers
      const contentType = response.headers.get('content-type');
      
      return { data, contentType: contentType ?? undefined };
    } catch (error) {
      console.error('Error getting object from storage:', error);
      throw error;
    }
  }
}

// Export the class
export { StorageService };
