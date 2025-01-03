import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { RecipeService } from '../../../business/services/recipe.service.ts';
import { RecipeRepository } from '../../../data/repositories/recipe.repository.ts';
import { cleanupTest, setupTest } from '../../test_utils.ts';
import { AppError } from '../../../types/errors.ts';
import { Recipe } from '../../../types/mod.ts';

Deno.test({
  name: 'RecipeService Tests',
  async fn() {
    const testContext = await setupTest();
    const recipeRepository = new RecipeRepository(testContext.database);
    const recipeService = new RecipeService(recipeRepository);
    const testUserId = 'test-user-123';

    try {
      const createTestRecipeData = (): Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> => ({
        name: 'Test Recipe',
        description: 'A test recipe description',
        ingredients: [
          {
            name: 'Test Ingredient',
            amount: 1,
            unit: 'piece',
          },
        ],
        instructions: ['Step 1: Test instruction'],
        userId: testUserId,
        tags: ['test'],
        dishType: {
          _id: 'maindishes-id',
          name: { en: 'Main Dishes', de: 'Hauptgerichte', fi: 'Pääruoat' },
          order: 1,
          imagePath: 'maindishes.jpg',
          identifier: 'maindishes',
          author: 'system',
          updated_at: new Date().toISOString()
        },
      });

      // Test: should create a new recipe
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipeData = createTestRecipeData();
        const recipe = await newService.createRecipe(recipeData);

        assertEquals(recipe.name, recipeData.name);
        assertEquals(recipe.description, recipeData.description);
        assertEquals(recipe.ingredients, recipeData.ingredients);
        assertEquals(recipe.instructions, recipeData.instructions);
        assertEquals(recipe.userId, recipeData.userId);
        assertEquals(recipe.tags, recipeData.tags);
        assertEquals(typeof recipe._id, 'string');
        assertEquals(recipe.createdAt instanceof Date, true);
        assertEquals(recipe.updatedAt instanceof Date, true);
      }

      // Test: should validate required fields
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipeData = createTestRecipeData();
        delete (recipeData as any).name;

        try {
          await newService.createRecipe(recipeData);
          throw new Error('Expected ValidationError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'VALIDATION_ERROR');
          assertEquals(err.statusCode, 400);
          assertEquals(err.message, 'Name is required');
        }
      }

      // Test: should validate ingredients
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipeData = {
          ...createTestRecipeData(),
          ingredients: [{ name: '', amount: -1, unit: '' }],
        };

        try {
          await newService.createRecipe(recipeData);
          throw new Error('Expected ValidationError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'VALIDATION_ERROR');
          assertEquals(err.statusCode, 400);
          assertEquals(err.message, 'Invalid ingredient');
        }
      }

      // Test: should get recipe by id
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipeData = createTestRecipeData();
        const created = await newService.createRecipe(recipeData);
        const recipe = await newService.getRecipeById(created._id);

        assertEquals(recipe?.name, recipeData.name);
        assertEquals(recipe?.description, recipeData.description);
        assertEquals(recipe?.ingredients, recipeData.ingredients);
        assertEquals(recipe?.instructions, recipeData.instructions);
        assertEquals(recipe?.userId, recipeData.userId);
        assertEquals(recipe?.tags, recipeData.tags);
      }

      // Test: should throw error for non-existent recipe
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        try {
          await newService.getRecipeById('507f1f77bcf86cd799439011');
          throw new Error('Expected ResourceNotFoundError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'RESOURCE_NOT_FOUND');
          assertEquals(err.statusCode, 404);
          assertEquals(err.message, 'Recipe not found');
        }
      }

      // Test: should list user recipes
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipe1 = await newService.createRecipe(createTestRecipeData());
        const recipe2 = await newService.createRecipe({
          ...createTestRecipeData(),
          name: 'Another Recipe',
        });

        const recipes = await newService.listUserRecipes(testUserId);

        assertEquals(recipes.length, 2);
        assertEquals(recipes[0]._id, recipe1._id);
        assertEquals(recipes[1]._id, recipe2._id);
      }

      // Test: should return empty array for user with no recipes
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipes = await newService.listUserRecipes('nonexistent-user');
        assertEquals(recipes.length, 0);
      }

      // Test: should update recipe details
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipe = await newService.createRecipe(createTestRecipeData());
        const updatedRecipe = await newService.updateRecipe(recipe._id, {
          name: 'Updated Title',
          description: 'Updated description',
        });

        assertEquals(updatedRecipe.name, 'Updated Title');
        assertEquals(updatedRecipe.description, 'Updated description');
        assertEquals(updatedRecipe.ingredients, recipe.ingredients);
        assertNotEquals(updatedRecipe.updatedAt, recipe.updatedAt);
      }

      // Test: should validate updated fields
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipe = await newService.createRecipe(createTestRecipeData());

        try {
          await newService.updateRecipe(recipe._id, {
            ingredients: [{ name: '', amount: -1, unit: '' }],
          });
          throw new Error('Expected ValidationError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'VALIDATION_ERROR');
          assertEquals(err.statusCode, 400);
          assertEquals(err.message, 'Invalid ingredient');
        }
      }

      // Test: should handle non-existent recipe
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        try {
          await newService.updateRecipe('507f1f77bcf86cd799439011', {
            name: 'Updated Title',
          });
          throw new Error('Expected ResourceNotFoundError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'RESOURCE_NOT_FOUND');
          assertEquals(err.statusCode, 404);
          assertEquals(err.message, 'Recipe not found');
        }
      }

      // Test: should delete recipe
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        const recipe = await newService.createRecipe(createTestRecipeData());
        await newService.deleteRecipe(recipe._id);

        try {
          await newService.getRecipeById(recipe._id);
          throw new Error('Expected ResourceNotFoundError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'RESOURCE_NOT_FOUND');
          assertEquals(err.statusCode, 404);
          assertEquals(err.message, 'Recipe not found');
        }
      }

      // Test: should throw error for non-existent recipe
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);
        try {
          await newService.deleteRecipe('507f1f77bcf86cd799439011');
          throw new Error('Expected ResourceNotFoundError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'RESOURCE_NOT_FOUND');
          assertEquals(err.statusCode, 404);
          assertEquals(err.message, 'Recipe not found');
        }
      }

      // Test: should count recipes by category and dishType
      {
        await cleanupTest();
        const newContext = await setupTest();
        const newRepository = new RecipeRepository(newContext.database);
        const newService = new RecipeService(newRepository);

        // Create recipes with different dishTypes
        await newService.createRecipe({
          ...createTestRecipeData(),
          dishType: {
            _id: 'breakfast-id',
            name: { en: 'Breakfast', de: 'Frühstück', fi: 'Aamiainen' },
            order: 0,
            imagePath: 'breakfast.jpg',
            identifier: 'breakfast',
            author: 'system',
            updated_at: new Date().toISOString()
          }
        });
        await newService.createRecipe({
          ...createTestRecipeData(),
          dishType: {
            _id: 'maindishes-id',
            name: { en: 'Main Dishes', de: 'Hauptgerichte', fi: 'Pääruoat' },
            order: 1,
            imagePath: 'maindishes.jpg',
            identifier: 'maindishes',
            author: 'system',
            updated_at: new Date().toISOString()
          }
        });
        await newService.createRecipe({
          ...createTestRecipeData(),
          dishType: {
            _id: 'breakfast-id',
            name: { en: 'Breakfast', de: 'Frühstück', fi: 'Aamiainen' },
            order: 0,
            imagePath: 'breakfast.jpg',
            identifier: 'breakfast',
            author: 'system',
            updated_at: new Date().toISOString()
          }
        });

        const counts = await newService.countRecipesByCategory(testUserId);

        // Verify total counts
        assertEquals(counts['all'], 3);
        assertEquals(counts['my'], 3);

        // Verify dishType counts
        assertEquals(counts['breakfast'], 2);
        assertEquals(counts['maindishes'], 1);
      }
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
