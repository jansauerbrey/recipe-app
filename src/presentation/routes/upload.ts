import { Router } from 'oak';
import { Status } from 'std/http/http_status.ts';
import { ensureDir } from 'std/fs/ensure_dir.ts';
import { join } from 'std/path/mod.ts';

const router = new Router();
const uploadDir = './upload';

// Ensure upload directory exists
await ensureDir(uploadDir);

// Serve uploaded files
router.get('/upload/:file', async (ctx) => {
  try {
    const fileName = ctx.params.file;
    if (!fileName) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: 'File name is required' };
      return;
    }

    const filePath = join(uploadDir, fileName);
    
    try {
      // Read file and serve it
      const fileBytes = await Deno.readFile(filePath);
      
      // Set appropriate headers for image serving
      ctx.response.headers.set('Content-Type', 'image/jpeg');
      ctx.response.headers.set('Cache-Control', 'public, max-age=31536000');
      ctx.response.headers.delete('Content-Security-Policy');
      
      ctx.response.body = fileBytes;
    } catch (error) {
      console.error('File error:', error);
      ctx.response.status = Status.NotFound;
      ctx.response.body = { error: 'File not found' };
      return;
    }
  } catch (error) {
    console.error('Error serving file:', error);
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = { error: 'Error serving file' };
  }
});

// Handle file uploads
router.post('/upload', async (ctx) => {
  try {
    const body = ctx.request.body({ type: 'form-data' });
    const formData = await body.value;
    const fileData = await formData.read();
    const uploadedFile = fileData.files?.[0];

    if (!uploadedFile || !uploadedFile.content) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = { error: 'No file uploaded' };
      return;
    }

    // Generate unique filename
    const extension = '.jpg'; // Since we're converting everything to JPEG
    const fileName = crypto.randomUUID() + extension;
    const filePath = join(uploadDir, fileName);

    // Save the file
    await Deno.writeFile(filePath, uploadedFile.content);

    ctx.response.status = Status.OK;
    ctx.response.body = { fileName };
  } catch (error) {
    console.error('Upload error:', error);
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = { error: 'Error processing upload' };
  }
});

export default router;
