import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { RecipeRepository } from '../../data/repositories/recipe.repository.ts';
import { createTestRecipe } from '../utils/factories.ts';
import { setupTest } from '../test_utils.ts';

describe('Recipe Repository - CRUD operations', () => {
  it('should handle CRUD operations', async () => {
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
      const deletedRecipe = await repository.findById(createdRecipe.id);
      assertEquals(deletedRecipe, null);
    } finally {
      await testContext.server.close();
    }
  });
});
