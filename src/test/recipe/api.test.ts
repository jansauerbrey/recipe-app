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

type TestRecipe = Omit<Recipe, 'id'> & { _id: string | ObjectId };

Deno.test({
  name: 'Recipe API - should create new recipe',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      const recipe = createTestRecipe({
        userId: testContext.testUserId!,
      });

      const response = await fetch(`${baseUrl}/recipes`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId!),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipe),
      });

      const createdRecipe = await assertSuccessResponse<TestRecipe>(response, 201);
      assertExists(createdRecipe._id, 'Response should include recipe ID');
      assertEquals(createdRecipe.name, recipe.name);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Recipe API - should read existing recipe',
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

      // Then read it back
      const getResponse = await fetch(`${baseUrl}/recipes/${createdRecipe._id}`, {
        headers: await createAuthHeader(testContext.testUserId!),
      });

      const retrievedRecipe = await assertSuccessResponse<TestRecipe>(getResponse);
      assertEquals(retrievedRecipe.name, recipe.name);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Recipe API - should update existing recipe',
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
        name: 'Updated Recipe Title',
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
      assertEquals(updatedRecipe.name, updates.name);
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
  name: 'Recipe API - should delete existing recipe',
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
