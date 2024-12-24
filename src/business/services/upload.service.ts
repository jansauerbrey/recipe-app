import { FileUploadError } from "../../types/errors.ts";
import { join } from "std/path/mod.ts";
import { ensureDir } from "std/fs/mod.ts";

export interface UploadedFile {
  fileName: string;
  content: Uint8Array;
  contentType: string;
}

export interface UploadResult {
  fileName: string;
  path: string;
  url: string;
}

export class UploadService {
  private uploadDir: string;
  private allowedTypes: string[];
  private maxFileSize: number;

  constructor(
    uploadDir = "./upload",
    allowedTypes = ["image/jpeg", "image/png", "image/gif"],
    maxFileSize = 5 * 1024 * 1024 // 5MB
  ) {
    this.uploadDir = uploadDir;
    this.allowedTypes = allowedTypes;
    this.maxFileSize = maxFileSize;
  }

  async initialize(): Promise<void> {
    try {
      await ensureDir(this.uploadDir);
    } catch (error) {
      throw new FileUploadError(`Failed to create upload directory: ${error.message}`);
    }
  }

  async uploadFile(file: UploadedFile): Promise<UploadResult> {
    // Validate file type
    if (!this.allowedTypes.includes(file.contentType)) {
      throw new FileUploadError(
        `Invalid file type. Allowed types: ${this.allowedTypes.join(", ")}`
      );
    }

    // Validate file size
    if (file.content.length > this.maxFileSize) {
      throw new FileUploadError(
        `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    try {
      // Generate unique filename
      const fileName = `${crypto.randomUUID()}${this.getFileExtension(file.contentType)}`;
      const filePath = join(this.uploadDir, fileName);

      // Save file
      await Deno.writeFile(filePath, file.content);

      return {
        fileName,
        path: filePath,
        url: `/upload/${fileName}`,
      };
    } catch (error) {
      throw new FileUploadError(`Failed to save file: ${error.message}`);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const filePath = join(this.uploadDir, fileName);
      await Deno.remove(filePath);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw new FileUploadError(`Failed to delete file: ${error.message}`);
      }
    }
  }

  async getFile(fileName: string): Promise<Uint8Array> {
    try {
      const filePath = join(this.uploadDir, fileName);
      return await Deno.readFile(filePath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new FileUploadError("File not found");
      }
      throw new FileUploadError(`Failed to read file: ${error.message}`);
    }
  }

  private getFileExtension(contentType: string): string {
    switch (contentType) {
      case "image/jpeg":
        return ".jpg";
      case "image/png":
        return ".png";
      case "image/gif":
        return ".gif";
      default:
        return "";
    }
  }

  // Helper method to validate file name
  private validateFileName(fileName: string): boolean {
    // Prevent directory traversal and ensure safe file names
    return !fileName.includes("..") && !fileName.includes("/") && !fileName.includes("\\");
  }
}
