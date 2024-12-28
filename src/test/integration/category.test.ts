import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { assertErrorResponse, assertSuccessResponse, createAuthHeader } from '../utils/helpers.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { Category } from '../../types/mod.ts';

type TestCategory = Omit<Category, '_id'> & { _id: string | ObjectId };

interface TestCategoryInput extends Omit<Category, '_id' | 'parent_id'> {
  parent_id?: string;
}

function createTestCategory(overrides: Partial<TestCategoryInput> = {}): Omit<Category, '_id'> {
  return {
    name: {
      en: 'Test Category',
      de: 'Test Kategorie',
      fi: 'Testiluokka',
    },
    rewe_cat_id: 123,
    updated_at: new Date(),
    ...overrides,
    parent_id: overrides.parent_id ? new ObjectId(overrides.parent_id) : undefined,
  };
}

Deno.test({
  name: 'Category Integration - should create and list categories',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Create category
      const category = createTestCategory();

      const createResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      const createdCategory = await assertSuccessResponse<TestCategory>(createResponse, 201);
      assertExists(createdCategory._id, 'Response should include category ID');

      // List categories
      const listResponse = await fetch(`${baseUrl}/categories`, {
        headers: await createAuthHeader(testContext.testUserId),
      });

      const categories = await assertSuccessResponse<TestCategory[]>(listResponse);
      assertEquals(categories.length, 1, 'Should return 1 category');
      assertEquals(categories[0]._id, createdCategory._id);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Category Integration - should update category',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // First create a category
      const category = createTestCategory();

      const createResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      const createdCategory = await assertSuccessResponse<TestCategory>(createResponse, 201);

      // Then update it
      const updates = {
        name: {
          en: 'Updated Category',
          de: 'Aktualisierte Kategorie',
          fi: 'Päivitetty Luokka',
        },
      };

      const updateResponse = await fetch(`${baseUrl}/categories/${createdCategory._id}`, {
        method: 'PUT',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      await assertSuccessResponse(updateResponse);

      // Verify update
      const getResponse = await fetch(`${baseUrl}/categories/${createdCategory._id}`, {
        headers: await createAuthHeader(testContext.testUserId),
      });

      const updatedCategory = await assertSuccessResponse<TestCategory>(getResponse);
      assertEquals(updatedCategory.name.en, updates.name.en);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Category Integration - should delete category',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // First create a category
      const category = createTestCategory();

      const createResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      const createdCategory = await assertSuccessResponse<TestCategory>(createResponse, 201);

      // Then delete it
      const deleteResponse = await fetch(`${baseUrl}/categories/${createdCategory._id}`, {
        method: 'DELETE',
        headers: await createAuthHeader(testContext.testUserId),
      });

      await assertSuccessResponse(deleteResponse);

      // Verify deletion
      const verifyResponse = await fetch(`${baseUrl}/categories/${createdCategory._id}`, {
        headers: await createAuthHeader(testContext.testUserId),
      });

      assertErrorResponse(verifyResponse, 404, 'Category not found');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Category Integration - should handle subcategories',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Create parent category
      const parentCategory = createTestCategory();
      const createParentResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parentCategory),
      });

      const createdParent = await assertSuccessResponse<TestCategory>(createParentResponse, 201);

      // Create child category
      const childCategory = createTestCategory({
        name: {
          en: 'Child Category',
          de: 'Kindkategorie',
          fi: 'Alaluokka',
        },
        parent_id: createdParent._id as string,
      });

      const createChildResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childCategory),
      });

      await assertSuccessResponse<TestCategory>(createChildResponse, 201);

      // Get subcategories
      const subcategoriesResponse = await fetch(
        `${baseUrl}/categories/${createdParent._id}/subcategories`,
        {
          headers: await createAuthHeader(testContext.testUserId),
        }
      );

      const subcategories = await assertSuccessResponse<TestCategory[]>(subcategoriesResponse);
      assertEquals(subcategories.length, 1, 'Should return 1 subcategory');
      assertEquals(subcategories[0].name.en, 'Child Category');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
