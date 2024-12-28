import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { BaseController, ControllerContext } from './base.controller.ts';
import { RecipeService } from '../../business/services/recipe.service.ts';
import { AuthenticationError, ValidationError } from '../../types/errors.ts';
import { Recipe } from '../../types/recipe.ts';
import { storageService } from '../../utils/storage.ts';

export class UploadController extends BaseController {
  constructor(private recipeService: RecipeService) {
    super();
  }

  async uploadRecipeImage(ctx: ControllerContext): Promise<void> {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const { id } = ctx.params;
      if (!id) {
        throw new ValidationError('Recipe ID is required');
      }

      // Verify recipe exists and belongs to user
      const recipe = await this.recipeService.getRecipeById(id);
      if (recipe.userId !== userId) {
        throw new AuthenticationError('Not authorized to modify this recipe');
      }

      console.log('Starting file upload process...');

      // Parse the multipart form data
      const form = await ctx.request.body({ type: "form-data" }).value;
      const formData = await form.read({
        // Specify maxSize to ensure we can handle larger files
        maxSize: 10 * 1024 * 1024, // 10MB
      });

      // Log full form data for debugging
      console.log('Form data:', {
        fields: formData.fields,
        files: formData.files?.map(f => ({
          name: f.name,
          originalName: f.originalName,
          contentType: f.contentType,
          size: f.content?.length || 0
        }))
      });

      // Get the uploaded file from the 'image' field
      const file = formData.files?.find(f => f.name === 'image');
      if (!file) {
        throw new ValidationError('No image file uploaded');
      }

      console.log('File details:', {
        name: file.originalName,
        type: file.contentType,
        hasContent: !!file.content
      });

      if (!file.contentType?.startsWith('image/')) {
        throw new ValidationError('Uploaded file must be an image');
      }

      if (!file.content) {
        throw new ValidationError('No file content received');
      }

      try {
        // Generate unique filename
        const ext = file.originalName?.split('.').pop() || 'jpg';
        const key = `recipes/${id}_${Date.now()}.${ext}`;

        // Upload to R2
        const imageUrl = await storageService.uploadFile(
          file.content,
          key,
          file.contentType || 'image/jpeg'
        );
        console.log(`File uploaded successfully to ${imageUrl}`);

        // Update recipe with image URL
        const update: Partial<Recipe> = { imagePath: imageUrl };
        await this.recipeService.updateRecipe(id, update);

        await this.ok(ctx, { filename: key, url: imageUrl });
      } catch (writeError: unknown) {
        console.error('File write error:', writeError);
        const errorMessage = writeError instanceof Error ? writeError.message : 'Unknown error occurred';
        throw new Error(`Failed to write file: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error instanceof ValidationError) {
        await this.badRequest(ctx, error.message);
      } else if (error instanceof AuthenticationError) {
        await this.unauthorized(ctx, error.message);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await this.internalServerError(ctx, `Failed to upload image: ${errorMessage}`);
      }
    }
  }
}
