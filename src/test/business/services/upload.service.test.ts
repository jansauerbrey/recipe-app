import {
  assertEquals,
  assertExists,
  assertRejects,
} from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { afterEach, beforeEach, describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { ensureDir } from 'https://deno.land/std@0.208.0/fs/mod.ts';
import { UploadService } from '../../../business/services/upload.service.ts';
import { AppError } from '../../../types/errors.ts';

const TEST_UPLOAD_DIR = './test-uploads';

describe('UploadService', () => {
  let uploadService: UploadService;

  beforeEach(async () => {
    // Set up test environment variables
    Deno.env.set('UPLOAD_DIR', TEST_UPLOAD_DIR);
    Deno.env.set('MAX_FILE_SIZE', '1048576'); // 1MB
    Deno.env.set('ALLOWED_FILE_TYPES', 'image/jpeg,image/png');

    // Create upload service
    uploadService = new UploadService();

    // Ensure test upload directory exists
    await ensureDir(TEST_UPLOAD_DIR);
  });

  afterEach(async () => {
    try {
      await Deno.remove(TEST_UPLOAD_DIR, { recursive: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
  });

  const createTestFile = (content = 'test content', type = 'image/jpeg'): File => {
    const blob = new Blob([content], { type });
    return new File([blob], 'test.jpg', { type });
  };

  it('should upload file successfully', async () => {
    const file = createTestFile();
    const result = await uploadService.uploadFile(file);

    // Verify result structure
    assertExists(result);
    assertEquals(typeof result.fileName, 'string');
    assertEquals(result.fileName.endsWith('.jpg'), true);
    assertEquals(result.url.startsWith('/upload/'), true);

    // Verify file was actually written
    const fileContent = await Deno.readFile(join(TEST_UPLOAD_DIR, result.fileName));
    assertEquals(new TextDecoder().decode(fileContent), 'test content');
  });

  it('should reject files that are too large', async () => {
    // Create a file larger than the max size
    const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
    const file = createTestFile(largeContent);

    try {
      await uploadService.uploadFile(file);
      throw new Error('Expected error was not thrown');
    } catch (error) {
      assertEquals(error instanceof AppError, true);
      assertEquals((error as AppError).statusCode, 400);
      assertEquals((error as AppError).code, 'FILE_TOO_LARGE');
    }
  });

  it('should reject files with invalid types', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    try {
      await uploadService.uploadFile(file);
      throw new Error('Expected error was not thrown');
    } catch (error) {
      assertEquals(error instanceof AppError, true);
      assertEquals((error as AppError).statusCode, 400);
      assertEquals((error as AppError).code, 'INVALID_FILE_TYPE');
    }
  });

  it('should delete file successfully', async () => {
    // First upload a file
    const file = createTestFile();
    const result = await uploadService.uploadFile(file);

    // Then delete it
    await uploadService.deleteFile(result.fileName);

    // Verify file was deleted
    try {
      await Deno.stat(join(TEST_UPLOAD_DIR, result.fileName));
      throw new Error('File should have been deleted');
    } catch (error) {
      assertEquals(error instanceof Deno.errors.NotFound, true);
    }
  });

  it('should handle deleting non-existent file', async () => {
    try {
      await uploadService.deleteFile('nonexistent.jpg');
      throw new Error('Expected error was not thrown');
    } catch (error) {
      assertEquals(error instanceof AppError, true);
      assertEquals((error as AppError).statusCode, 404);
      assertEquals((error as AppError).code, 'FILE_NOT_FOUND');
    }
  });

  it('should get file successfully', async () => {
    // First upload a file
    const file = createTestFile();
    const result = await uploadService.uploadFile(file);

    // Then get it
    const content = await uploadService.getFile(result.fileName);
    assertEquals(new TextDecoder().decode(content), 'test content');
  });

  it('should handle getting non-existent file', async () => {
    try {
      await uploadService.getFile('nonexistent.jpg');
      throw new Error('Expected error was not thrown');
    } catch (error) {
      assertEquals(error instanceof AppError, true);
      assertEquals((error as AppError).statusCode, 404);
      assertEquals((error as AppError).code, 'FILE_NOT_FOUND');
    }
  });
});
