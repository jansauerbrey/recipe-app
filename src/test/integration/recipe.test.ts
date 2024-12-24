import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { afterEach, beforeEach, describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { withTestDatabase } from '../utils/database.ts';
import { createTestRecipe, createTestUser } from '../utils/factories.ts';
import { assertErrorResponse, assertRecipeExists, createAuthHeader } from '../utils/helpers.ts';

describe('Recipe API Integration Tests', () => {
  const baseUrl = 'http://localhost:3000/api';

  describe('POST /recipes', () => {
    it(
      'should create a new recipe',
      withTestDatabase(async ({ db }) => {
        // Create test user
        const user = createTestUser();
        const users = db.collection('users');
        const { _id: userId } = await users.insertOne(user);

        // Create test recipe data
        const recipe = createTestRecipe({
          userId: userId.toString(),
        });

        // Make API request
        const response = await fetch(`${baseUrl}/recipes`, {
          method: 'POST',
          headers: createAuthHeader('test-token'), // You'd normally get a real token
          body: JSON.stringify(recipe),
        });

        // Assert response
        assertEquals(response.status, 201);
        const body = await response.json();
        assertExists(body._id);

        // Verify database state
        await assertRecipeExists(db, recipe);
      }),
    );

    it(
      'should validate required fields',
      withTestDatabase(async ({ db }) => {
        // Create test user
        const user = createTestUser();
        const users = db.collection('users');
        await users.insertOne(user);

        // Make API request with missing fields
        const response = await fetch(`${baseUrl}/recipes`, {
          method: 'POST',
          headers: createAuthHeader('test-token'),
          body: JSON.stringify({
            // Missing required fields
          }),
        });

        // Assert error response
        assertErrorResponse(response, 400, 'Missing required fields');
      }),
    );
  });

  describe('GET /recipes', () => {
    it(
      'should list user recipes',
      withTestDatabase(async ({ db }) => {
        // Create test user
        const user = createTestUser();
        const users = db.collection('users');
        const { _id: userId } = await users.insertOne(user);

        // Create test recipes
        const recipes = db.collection('recipes');
        const testRecipes = [
          createTestRecipe({ userId: userId.toString() }),
          createTestRecipe({ userId: userId.toString() }),
        ];
        await recipes.insertMany(testRecipes);

        // Make API request
        const response = await fetch(`${baseUrl}/recipes`, {
          headers: createAuthHeader('test-token'),
        });

        // Assert response
        assertEquals(response.status, 200);
        const body = await response.json();
        assertEquals(body.length, 2);

        // Verify response data
        for (const recipe of body) {
          assertExists(recipe._id);
          assertEquals(recipe.userId, userId.toString());
        }
      }),
    );
  });

  describe('PUT /recipes/:id', () => {
    it(
      'should update existing recipe',
      withTestDatabase(async ({ db }) => {
        // Create test user and recipe
        const user = createTestUser();
        const users = db.collection('users');
        const { _id: userId } = await users.insertOne(user);

        const recipe = createTestRecipe({ userId: userId.toString() });
        const recipes = db.collection('recipes');
        const { _id: recipeId } = await recipes.insertOne(recipe);

        // Update data
        const updates = {
          title: 'Updated Recipe Title',
          description: 'Updated description',
        };

        // Make API request
        const response = await fetch(`${baseUrl}/recipes/${recipeId}`, {
          method: 'PUT',
          headers: createAuthHeader('test-token'),
          body: JSON.stringify(updates),
        });

        // Assert response
        assertEquals(response.status, 200);
        const body = await response.json();
        assertEquals(body.title, updates.title);
        assertEquals(body.description, updates.description);

        // Verify database state
        const updatedRecipe = await recipes.findOne({ _id: recipeId });
        assertExists(updatedRecipe);
        assertEquals(updatedRecipe.title, updates.title);
        assertEquals(updatedRecipe.description, updates.description);
      }),
    );
  });

  describe('DELETE /recipes/:id', () => {
    it(
      'should delete existing recipe',
      withTestDatabase(async ({ db }) => {
        // Create test user and recipe
        const user = createTestUser();
        const users = db.collection('users');
        const { _id: userId } = await users.insertOne(user);

        const recipe = createTestRecipe({ userId: userId.toString() });
        const recipes = db.collection('recipes');
        const { _id: recipeId } = await recipes.insertOne(recipe);

        // Make API request
        const response = await fetch(`${baseUrl}/recipes/${recipeId}`, {
          method: 'DELETE',
          headers: createAuthHeader('test-token'),
        });

        // Assert response
        assertEquals(response.status, 204);

        // Verify database state
        const deletedRecipe = await recipes.findOne({ _id: recipeId });
        assertEquals(deletedRecipe, null);
      }),
    );
  });
});
