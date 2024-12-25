import {
  assertEquals,
  assertExists,
  assertRejects,
} from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { RecipeRepository } from '../../data/repositories/recipe.repository.ts';
import { createTestRecipe } from '../utils/factories.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { AppError, ResourceNotFoundError } from '../../types/errors.ts';

Deno.test({
  name: 'Recipe Repository - CRUD operations',
  async fn() {
    const testContext = await setupTest();

    try {
      const repository = new RecipeRepository(testContext.mongoClient);

      // Create
      const recipe = createTestRecipe({
        userId: testContext.testUserId!,
      });

      const createdRecipe = await repository.create(recipe);
      assertExists(createdRecipe.id);
      assertEquals(createdRecipe.title, recipe.title);
      assertEquals(createdRecipe.userId, recipe.userId);

      // Read
      const foundRecipe = await repository.findById(createdRecipe.id);
      assertExists(foundRecipe);
      assertEquals(foundRecipe.id, createdRecipe.id);
      assertEquals(foundRecipe.title, recipe.title);

      // Update
      const updates = {
        title: 'Updated Recipe Title',
        description: 'Updated description',
      };

      const updatedRecipe = await repository.update(createdRecipe.id, updates);
      assertEquals(updatedRecipe.id, createdRecipe.id);
      assertEquals(updatedRecipe.title, updates.title);
      assertEquals(updatedRecipe.description, updates.description);

      // Delete
      await repository.delete(createdRecipe.id);

      // Verify deletion by expecting ResourceNotFoundError
      try {
        await repository.findById(createdRecipe.id);
        throw new Error('Expected ResourceNotFoundError but got no error');
      } catch (error) {
        const err = error as AppError;
        assertEquals(err.code, 'RESOURCE_NOT_FOUND');
        assertEquals(err.statusCode, 404);
        assertEquals(err.message, 'Recipe not found');
      }
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
