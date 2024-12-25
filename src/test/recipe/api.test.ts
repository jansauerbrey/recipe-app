import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { createTestRecipe } from '../utils/factories.ts';
import {
  assertErrorResponse,
  assertRecipeExists,
  assertSuccessResponse,
  createAuthHeader,
} from '../utils/helpers.ts';
import { setupTest } from '../test_utils.ts';
import { Recipe } from '../../types/mod.ts';

type TestRecipe = Omit<Recipe, 'id'> & { _id: string | ObjectId };

describe('Recipe API - CRUD operations', () => {
  it('should handle full CRUD lifecycle', async () => {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Create
      const recipe = createTestRecipe({
        userId: testContext.testUserId!,
      });

      const createResponse = await fetch(`${baseUrl}/recipes`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId!),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipe),
      });

      const createdRecipe = await assertSuccessResponse<TestRecipe>(createResponse, 201);
      assertExists(createdRecipe._id, 'Response should include recipe ID');

      // Read
      const getResponse = await fetch(`${baseUrl}/recipes/${createdRecipe._id}`, {
        headers: await createAuthHeader(testContext.testUserId!),
      });

      const retrievedRecipe = await assertSuccessResponse<TestRecipe>(getResponse);
      assertEquals(retrievedRecipe.title, recipe.title);

      // Update
      const updates = {
        title: 'Updated Recipe Title',
        description: 'Updated description',
      };

      const updateResponse = await fetch(`${baseUrl}/recipes/${createdRecipe._id}`, {
        method: 'PUT',
        headers: {
          ...await createAuthHeader(testContext.testUserId!),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const updatedRecipe = await assertSuccessResponse<TestRecipe>(updateResponse);
      assertEquals(updatedRecipe.title, updates.title);
      assertEquals(updatedRecipe.description, updates.description);

      // Delete
      const deleteResponse = await fetch(`${baseUrl}/recipes/${createdRecipe._id}`, {
        method: 'DELETE',
        headers: await createAuthHeader(testContext.testUserId!),
      });

      assertEquals(deleteResponse.status, 204);

      // Verify deletion
      const verifyResponse = await fetch(`${baseUrl}/recipes/${createdRecipe._id}`, {
        headers: await createAuthHeader(testContext.testUserId!),
      });

      assertErrorResponse(verifyResponse, 404, 'Recipe not found');
    } finally {
      await testContext.server.close();
    }
  });
});
