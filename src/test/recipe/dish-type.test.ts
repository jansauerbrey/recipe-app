
import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { cleanupTest, setupTest } from '../test_utils.ts';
import { DishTypeRepository } from '../../data/repositories/dish-type.repository.ts';
import { LocalizedName } from '../../types/recipe.ts';
import { DishType } from '../../types/dishtype.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

Deno.test({
  name: 'DishType Repository - CRUD operations',
  async fn() {
    const testContext = await setupTest();

    try {
      const repository = new DishTypeRepository(testContext.database);

      // Test create with LocalizedName
      const dishType: Omit<DishType, '_id'> = {
        name: { en: 'Breakfast', de: 'Frühstück', fi: 'Aamiainen' },
        imagePath: '/img/dishtypes/breakfast.jpg',
        author: new ObjectId(testContext.testUserId!),
        order: 1,
        identifier: 'breakfast',
        updated_at: new Date()
      };

      const created = await repository.create(dishType);
      assertExists(created._id);
      assertEquals(created.name, dishType.name);

      // Test find by id
      const found = await repository.findById(created._id);
      assertExists(found);
      assertEquals(found?.name, dishType.name);

      // Test update
      const updates: Partial<DishType> = {
        name: { en: 'Morning Meal', de: 'Morgenmahlzeit', fi: 'Aamupala' } as LocalizedName,
      };

      const updated = await repository.update(created._id, updates);
      assertEquals(updated.name, updates.name);

      // Test delete
      await repository.delete(created._id);
      const deleted = await repository.findById(created._id);
      assertEquals(deleted, null);
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'DishType Repository - Validation',
  async fn() {
    const testContext = await setupTest();

    try {
      const repository = new DishTypeRepository(testContext.database);

      // Test missing required fields
      const invalidDishType: Omit<DishType, '_id'> = {
        name: { en: 'Test' } as LocalizedName, // Missing de and fi
        imagePath: '',
        author: new ObjectId(testContext.testUserId!),
        order: 0,
        identifier: '',
        updated_at: new Date()
      };

      try {
        await repository.create(invalidDishType);
        throw new Error('Expected validation error but got none');
      } catch (error: any) {
        assertEquals(error.message.includes('Validation failed'), true);
      }
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
