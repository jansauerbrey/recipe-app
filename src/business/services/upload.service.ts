import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppError } from '../../types/errors.ts';
import { ensureDir } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { getConfig } from '../../types/env.ts';

export interface UploadResult {
  fileName: string;
  url: string;
}

export class UploadService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor() {
    const config = getConfig();
    this.uploadDir = config.UPLOAD_DIR;
    this.maxFileSize = config.MAX_FILE_SIZE;
    this.allowedTypes = config.ALLOWED_FILE_TYPES.map((t: string) => t.trim());
  }

  async uploadFile(file: File): Promise<UploadResult> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new AppError(
        `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`,
        Status.BadRequest,
        'FILE_TOO_LARGE',
      );
    }

    // Validate file type
    const fileType = file.type;
    if (!this.allowedTypes.includes(fileType)) {
      throw new AppError(
        `File type ${fileType} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`,
        Status.BadRequest,
        'INVALID_FILE_TYPE',
      );
    }

    // Ensure upload directory exists
    await ensureDir(this.uploadDir);

    // Generate unique filename
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const filePath = join(this.uploadDir, fileName);

    try {
      // Write file to disk
      const arrayBuffer = await file.arrayBuffer();
      await Deno.writeFile(filePath, new Uint8Array(arrayBuffer));

      return {
        fileName,
        url: `/upload/${fileName}`,
      };
    } catch (error: unknown) {
      throw new AppError(
        `Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Status.InternalServerError,
        'FILE_SAVE_ERROR',
      );
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = join(this.uploadDir, fileName);

    try {
      await Deno.remove(filePath);
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        throw new AppError(
          'File not found',
          Status.NotFound,
          'FILE_NOT_FOUND',
        );
      }
      throw new AppError(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Status.InternalServerError,
        'FILE_DELETE_ERROR',
      );
    }
  }

  async getFile(fileName: string): Promise<Uint8Array> {
    const filePath = join(this.uploadDir, fileName);
    try {
      return await Deno.readFile(filePath);
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        throw new AppError(
          'File not found',
          Status.NotFound,
          'FILE_NOT_FOUND',
        );
      }
      throw new AppError(
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        Status.InternalServerError,
        'FILE_READ_ERROR',
      );
    }
  }
}
