import { assertErrorResponse, createAuthHeader } from '../utils/helpers.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

Deno.test({
  name: 'Category Validation - should validate required fields on create',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Missing name translations
      const invalidCategory = {
        name: {
          en: 'Test Category',
          // Missing de and fi translations
        },
        rewe_cat_id: 123,
      };

      const response = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCategory),
      });

      assertErrorResponse(response, 400, 'Name translations (en, de, fi) are required');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Category Validation - should validate parent category existence',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      const category = {
        name: {
          en: 'Test Category',
          de: 'Test Kategorie',
          fi: 'Testiluokka',
        },
        parent_id: new ObjectId().toString(), // Generate a valid but non-existent ID
        rewe_cat_id: 123,
      };

      const response = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      assertErrorResponse(response, 400, 'Parent category not found');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Category Validation - should prevent deletion of category with subcategories',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Create parent category
      const parentCategory = {
        name: {
          en: 'Parent Category',
          de: 'Elternkategorie',
          fi: 'Yläluokka',
        },
        rewe_cat_id: 123,
      };

      const createParentResponse = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parentCategory),
      });

      const createdParent = await createParentResponse.json();

      // Create child category
      const childCategory = {
        name: {
          en: 'Child Category',
          de: 'Kindkategorie',
          fi: 'Alaluokka',
        },
        parent_id: createdParent._id,
        rewe_cat_id: 456,
      };

      await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childCategory),
      });

      // Try to delete parent category
      const deleteResponse = await fetch(`${baseUrl}/categories/${createdParent._id}`, {
        method: 'DELETE',
        headers: await createAuthHeader(testContext.testUserId),
      });

      assertErrorResponse(deleteResponse, 400, 'Cannot delete category with child categories');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Category Validation - should prevent deletion of category with ingredients',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Create category
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

      const createdCategory = await createCategoryResponse.json();

      // Create ingredient in that category
      const ingredient = {
        name: {
          en: 'Test Ingredient',
          de: 'Test Zutat',
          fi: 'Testiaines',
        },
        category_id: createdCategory._id,
        rewe_art_no: 12345,
        rewe_img_links: {
          xs: 'https://example.com/img/xs.jpg',
          sm: 'https://example.com/img/sm.jpg',
          md: 'https://example.com/img/md.jpg',
        },
      };

      await fetch(`${baseUrl}/ingredients`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredient),
      });

      // Try to delete category
      const deleteResponse = await fetch(`${baseUrl}/categories/${createdCategory._id}`, {
        method: 'DELETE',
        headers: await createAuthHeader(testContext.testUserId),
      });

      assertErrorResponse(deleteResponse, 400, 'Cannot delete category that is used by ingredients');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
