import { assertErrorResponse, createAuthHeader } from '../utils/helpers.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

Deno.test({
  name: 'Ingredient Validation - should validate required fields on create',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Missing name translations
      const invalidIngredient = {
        name: {
          en: 'Test Ingredient',
          // Missing de and fi translations
        },
        category_id: '507f1f77bcf86cd799439011', // Valid ObjectId format
        rewe_art_no: 12345,
        rewe_img_links: {
          xs: 'https://example.com/img/xs.jpg',
          sm: 'https://example.com/img/sm.jpg',
          md: 'https://example.com/img/md.jpg',
        },
      };

      const response = await fetch(`${baseUrl}/ingredients`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidIngredient),
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
  name: 'Ingredient Validation - should validate category existence',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      // Try to create an ingredient with a non-existent category ID
      const ingredient = {
        name: {
          en: 'Test Ingredient',
          de: 'Test Zutat',
          fi: 'Testiaines',
        },
        category_id: new ObjectId().toString(), // Generate a valid but non-existent ID
        rewe_art_no: 12345,
        rewe_img_links: {
          xs: 'https://example.com/img/xs.jpg',
          sm: 'https://example.com/img/sm.jpg',
          md: 'https://example.com/img/md.jpg',
        },
      };

      const response = await fetch(`${baseUrl}/ingredients`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredient),
      });

      assertErrorResponse(response, 400, 'Category not found');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Ingredient Validation - should validate image links',
  async fn() {
    const testContext = await setupTest();
    const baseUrl = `http://localhost:${testContext.port}/api`;

    try {
      const ingredient = {
        name: {
          en: 'Test Ingredient',
          de: 'Test Zutat',
          fi: 'Testiaines',
        },
        category_id: '507f1f77bcf86cd799439011',
        rewe_art_no: 12345,
        rewe_img_links: {
          xs: 'https://example.com/img/xs.jpg',
          // Missing sm and md links
        },
      };

      const response = await fetch(`${baseUrl}/ingredients`, {
        method: 'POST',
        headers: {
          ...await createAuthHeader(testContext.testUserId),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredient),
      });

      assertErrorResponse(response, 400, 'All REWE image links (xs, sm, md) are required');
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
