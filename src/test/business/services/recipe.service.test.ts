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
    const recipeRepository = new RecipeRepository(testContext.mongoClient);
    const recipeService = new RecipeService(recipeRepository);
    const testUserId = 'test-user-123';

    try {
      // Clean up any existing recipes
      await testContext.mongoClient.database('recipe_app_test').collection('recipes').deleteMany(
        {},
      );

      const createTestRecipeData = (): Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> => ({
        title: 'Test Recipe',
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
      });

      // Test: should create a new recipe
      {
        await testContext.mongoClient.database('recipe_app_test').collection('recipes').deleteMany(
          {},
        );
        const recipeData = createTestRecipeData();
        const recipe = await recipeService.createRecipe(recipeData);

        assertEquals(recipe.title, recipeData.title);
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
        const recipeData = createTestRecipeData();
        delete (recipeData as any).title;

        try {
          await recipeService.createRecipe(recipeData);
          throw new Error('Expected ValidationError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'VALIDATION_ERROR');
          assertEquals(err.statusCode, 400);
          assertEquals(err.message, 'Title is required');
        }
      }

      // Test: should validate ingredients
      {
        const recipeData = {
          ...createTestRecipeData(),
          ingredients: [{ name: '', amount: -1, unit: '' }],
        };

        try {
          await recipeService.createRecipe(recipeData);
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
        await testContext.mongoClient.database('recipe_app_test').collection('recipes').deleteMany(
          {},
        );
        const recipeData = createTestRecipeData();
        const created = await recipeService.createRecipe(recipeData);
        const recipe = await recipeService.getRecipeById(created._id);

        assertEquals(recipe?.title, recipeData.title);
        assertEquals(recipe?.description, recipeData.description);
        assertEquals(recipe?.ingredients, recipeData.ingredients);
        assertEquals(recipe?.instructions, recipeData.instructions);
        assertEquals(recipe?.userId, recipeData.userId);
        assertEquals(recipe?.tags, recipeData.tags);
      }

      // Test: should throw error for non-existent recipe
      {
        try {
          await recipeService.getRecipeById('507f1f77bcf86cd799439011');
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
        await testContext.mongoClient.database('recipe_app_test').collection('recipes').deleteMany(
          {},
        );
        const recipe1 = await recipeService.createRecipe(createTestRecipeData());
        const recipe2 = await recipeService.createRecipe({
          ...createTestRecipeData(),
          title: 'Another Recipe',
        });

        const recipes = await recipeService.listUserRecipes(testUserId);

        assertEquals(recipes.length, 2);
        assertEquals(recipes[0]._id, recipe1._id);
        assertEquals(recipes[1]._id, recipe2._id);
      }

      // Test: should return empty array for user with no recipes
      {
        const recipes = await recipeService.listUserRecipes('nonexistent-user');
        assertEquals(recipes.length, 0);
      }

      // Test: should update recipe details
      {
        await testContext.mongoClient.database('recipe_app_test').collection('recipes').deleteMany(
          {},
        );
        const recipe = await recipeService.createRecipe(createTestRecipeData());
        const updatedRecipe = await recipeService.updateRecipe(recipe._id, {
          title: 'Updated Title',
          description: 'Updated description',
        });

        assertEquals(updatedRecipe.title, 'Updated Title');
        assertEquals(updatedRecipe.description, 'Updated description');
        assertEquals(updatedRecipe.ingredients, recipe.ingredients);
        assertNotEquals(updatedRecipe.updatedAt, recipe.updatedAt);
      }

      // Test: should validate updated fields
      {
        await testContext.mongoClient.database('recipe_app_test').collection('recipes').deleteMany(
          {},
        );
        const recipe = await recipeService.createRecipe(createTestRecipeData());

        try {
          await recipeService.updateRecipe(recipe._id, {
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
        try {
          await recipeService.updateRecipe('507f1f77bcf86cd799439011', {
            title: 'Updated Title',
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
        await testContext.mongoClient.database('recipe_app_test').collection('recipes').deleteMany(
          {},
        );
        const recipe = await recipeService.createRecipe(createTestRecipeData());
        await recipeService.deleteRecipe(recipe._id);

        try {
          await recipeService.getRecipeById(recipe._id);
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
        try {
          await recipeService.deleteRecipe('507f1f77bcf86cd799439011');
          throw new Error('Expected ResourceNotFoundError but got no error');
        } catch (error) {
          const err = error as AppError;
          assertEquals(err.code, 'RESOURCE_NOT_FOUND');
          assertEquals(err.statusCode, 404);
          assertEquals(err.message, 'Recipe not found');
        }
      }
    } finally {
      await testContext.server.close();
      await cleanupTest();
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
