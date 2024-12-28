import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { assertErrorResponse, assertSuccessResponse, createAuthHeader } from '../utils/helpers.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { Ingredient } from '../../types/mod.ts';

type TestIngredient = Omit<Ingredient, '_id'> & { _id: string | ObjectId };

interface TestIngredientInput extends Omit<Ingredient, '_id' | 'author_id' | 'category_id'> {
  category_id?: string;
}

function createTestIngredient(overrides: Partial<TestIngredientInput> = {}): Omit<Ingredient, '_id' | 'author_id'> {
  return {
    name: {
      en: 'Test Ingredient',
      de: 'Test Zutat',
      fi: 'Testiaines',
    },
    rewe_art_no: 12345,
    rewe_img_links: {
      xs: 'https://example.com/img/xs.jpg',
      sm: 'https://example.com/img/sm.jpg',
      md: 'https://example.com/img/md.jpg',
    },
    updated_at: new Date(),
    ...overrides,
    category_id: overrides.category_id ? new ObjectId(overrides.category_id) : new ObjectId()
  };
}

Deno.test({
  name: 'Ingredient Integration - should create and list ingredients',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // First create a category
      const category = {
        name: {
          en: 'Test Category',
          de: 'Test Kategorie',
          fi: 'Testiluokka',
        },
        rewe_cat_id: 123,
      };

      const createCategoryResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      const createdCategory = await assertSuccessResponse<{ _id: string }>(createCategoryResponse, 201);

      // Then create ingredient in that category
      const ingredient = createTestIngredient({
        category_id: createdCategory._id,
      });

      const createResponse = await fetch(`${baseUrl}/ingredients`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredient),
      });

      const createdIngredient = await assertSuccessResponse<TestIngredient>(createResponse, 201);
      assertExists(createdIngredient._id, 'Response should include ingredient ID');

      // List ingredients
      const listResponse = await fetch(`${baseUrl}/ingredients`, {
        headers: await createAuthHeader(testContext.testUserId),
      });

      const ingredients = await assertSuccessResponse<TestIngredient[]>(listResponse);
      assertEquals(ingredients.length, 1, 'Should return 1 ingredient');
      assertEquals(ingredients[0]._id, createdIngredient._id);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Ingredient Integration - should update ingredient',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // First create a category
      const category = {
        name: {
          en: 'Test Category',
          de: 'Test Kategorie',
          fi: 'Testiluokka',
        },
        rewe_cat_id: 123,
      };

      const createCategoryResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      const createdCategory = await assertSuccessResponse<{ _id: string }>(createCategoryResponse, 201);

      // Then create ingredient in that category
      const ingredient = createTestIngredient({
        category_id: createdCategory._id,
      });

      const createResponse = await fetch(`${baseUrl}/ingredients`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredient),
      });

      const createdIngredient = await assertSuccessResponse<TestIngredient>(createResponse, 201);

      // Then update it
      const updates = {
        name: {
          en: 'Updated Ingredient',
          de: 'Aktualisierte Zutat',
          fi: 'Päivitetty Aines',
        },
      };

      const updateResponse = await fetch(`${baseUrl}/ingredients/${createdIngredient._id}`, {
        method: 'PUT',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      await assertSuccessResponse(updateResponse);

      // Verify update
      const getResponse = await fetch(`${baseUrl}/ingredients/${createdIngredient._id}`, {
        headers: await createAuthHeader(testContext.testUserId),
      });

      const updatedIngredient = await assertSuccessResponse<TestIngredient>(getResponse);
      assertEquals(updatedIngredient.name.en, updates.name.en);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Ingredient Integration - should delete ingredient',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // First create a category
      const category = {
        name: {
          en: 'Test Category',
          de: 'Test Kategorie',
          fi: 'Testiluokka',
        },
        rewe_cat_id: 123,
      };

      const createCategoryResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      const createdCategory = await assertSuccessResponse<{ _id: string }>(createCategoryResponse, 201);

      // Then create ingredient in that category
      const ingredient = createTestIngredient({
        category_id: createdCategory._id,
      });

      const createResponse = await fetch(`${baseUrl}/ingredients`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredient),
      });

      const createdIngredient = await assertSuccessResponse<TestIngredient>(createResponse, 201);

      // Then delete it
      const deleteResponse = await fetch(`${baseUrl}/ingredients/${createdIngredient._id}`, {
        method: 'DELETE',
        headers: await createAuthHeader(testContext.testUserId),
      });

      await assertSuccessResponse(deleteResponse);

      // Verify deletion
      const verifyResponse = await fetch(`${baseUrl}/ingredients/${createdIngredient._id}`, {
        headers: await createAuthHeader(testContext.testUserId),
      });

      assertErrorResponse(verifyResponse, 404, 'Ingredient not found');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Ingredient Integration - should get ingredients by category',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // First create a category
      const category = {
        name: {
          en: 'Test Category',
          de: 'Test Kategorie',
          fi: 'Testiluokka',
        },
        rewe_cat_id: 123,
        updated_at: new Date(),
      };

      const createCategoryResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      const createdCategory = await assertSuccessResponse<{ _id: string }>(createCategoryResponse, 201);

      // Create ingredient in that category
      const ingredient = createTestIngredient({
        category_id: createdCategory._id,
      });

      const createIngredientResponse = await fetch(`${baseUrl}/ingredients`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredient),
      });

      await assertSuccessResponse<TestIngredient>(createIngredientResponse, 201);

      // Get ingredients by category
      const getResponse = await fetch(
        `${baseUrl}/categories/${createdCategory._id}/ingredients`,
        {
          headers: await createAuthHeader(testContext.testUserId),
        }
      );

      const ingredients = await assertSuccessResponse<TestIngredient[]>(getResponse);
      assertEquals(ingredients.length, 1, 'Should return 1 ingredient');
      assertEquals(ingredients[0].name.en, 'Test Ingredient');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
