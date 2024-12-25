import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { createTestRecipe } from '../utils/factories.ts';
import {
  assertErrorResponse,
  assertRecipeExists,
  assertSuccessResponse,
  createAuthHeader,
} from '../utils/helpers.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { Recipe } from '../../types/mod.ts';
import type { TestContext } from '../test_utils.ts';

type TestRecipe = Omit<Recipe, 'id'> & { _id: string | ObjectId };

Deno.test({
  name: 'Recipe Integration - should create and list recipes',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Create recipe
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

      // List recipes
      const listResponse = await fetch(`${baseUrl}/recipes`, {
        headers: await createAuthHeader(testContext.testUserId!),
      });

      const recipes = await assertSuccessResponse<TestRecipe[]>(listResponse);
      assertEquals(recipes.length, 1, 'Should return 1 recipe');
      assertEquals(recipes[0]._id, createdRecipe._id);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Recipe Integration - should update recipe',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // First create a recipe
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

      // Then update it
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
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Recipe Integration - should delete recipe',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // First create a recipe
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

      // Then delete it
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
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
