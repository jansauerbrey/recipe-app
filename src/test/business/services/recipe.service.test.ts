import {
  assertEquals,
  assertNotEquals,
  assertRejects,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { afterEach, beforeEach, describe, it } from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { RecipeService } from '../../../business/services/recipe.service.ts';
import { RecipeRepository } from '../../../data/repositories/recipe.repository.ts';
import { cleanupTest, setupTest } from '../../test_utils.ts';
import { ValidationError } from '../../../types/errors.ts';
import { Recipe } from '../../../types/mod.ts';
import { AppError } from '../../../types/middleware.ts';

describe('RecipeService', () => {
  let recipeService: RecipeService;
  let recipeRepository: RecipeRepository;
  let client: any;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    const testContext = await setupTest();
    client = testContext.mongoClient;
    recipeRepository = new RecipeRepository(client);
    recipeService = new RecipeService(recipeRepository);
  });

  afterEach(async () => {
    await cleanupTest();
  });

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

  describe('createRecipe', () => {
    it('should create a new recipe', async () => {
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
    });

    it('should validate required fields', async () => {
      const recipeData = createTestRecipeData();
      delete (recipeData as any).title;

      await assertRejects(
        async () => {
          await recipeService.createRecipe(recipeData);
        },
        ValidationError,
        'Title is required',
      );
    });

    it('should validate ingredients', async () => {
      const recipeData = {
        ...createTestRecipeData(),
        ingredients: [{ name: '', amount: -1, unit: '' }],
      };

      await assertRejects(
        async () => {
          await recipeService.createRecipe(recipeData);
        },
        ValidationError,
        'Invalid ingredient',
      );
    });
  });

  describe('getRecipeById', () => {
    it('should get recipe by id', async () => {
      const recipeData = createTestRecipeData();
      const created = await recipeService.createRecipe(recipeData);
      const recipe = await recipeService.getRecipeById(created._id);

      assertEquals(recipe?.title, recipeData.title);
      assertEquals(recipe?.description, recipeData.description);
      assertEquals(recipe?.ingredients, recipeData.ingredients);
      assertEquals(recipe?.instructions, recipeData.instructions);
      assertEquals(recipe?.userId, recipeData.userId);
      assertEquals(recipe?.tags, recipeData.tags);
    });

    it('should throw error for non-existent recipe', async () => {
      await assertRejects(
        async () => {
          await recipeService.getRecipeById('nonexistent-id');
        },
        AppError,
        'Recipe not found',
      );
    });
  });

  describe('listUserRecipes', () => {
    it('should list user recipes', async () => {
      const recipe1 = await recipeService.createRecipe(createTestRecipeData());
      const recipe2 = await recipeService.createRecipe({
        ...createTestRecipeData(),
        title: 'Another Recipe',
      });

      const recipes = await recipeService.listUserRecipes(testUserId);

      assertEquals(recipes.length, 2);
      assertEquals(recipes[0]._id, recipe1._id);
      assertEquals(recipes[1]._id, recipe2._id);
    });

    it('should return empty array for user with no recipes', async () => {
      const recipes = await recipeService.listUserRecipes('nonexistent-user');
      assertEquals(recipes.length, 0);
    });
  });

  describe('updateRecipe', () => {
    it('should update recipe details', async () => {
      const recipe = await recipeService.createRecipe(createTestRecipeData());
      const updatedRecipe = await recipeService.updateRecipe(recipe._id, {
        title: 'Updated Title',
        description: 'Updated description',
      });

      assertEquals(updatedRecipe.title, 'Updated Title');
      assertEquals(updatedRecipe.description, 'Updated description');
      assertEquals(updatedRecipe.ingredients, recipe.ingredients);
      assertNotEquals(updatedRecipe.updatedAt, recipe.updatedAt);
    });

    it('should validate updated fields', async () => {
      const recipe = await recipeService.createRecipe(createTestRecipeData());

      await assertRejects(
        async () => {
          await recipeService.updateRecipe(recipe._id, {
            ingredients: [{ name: '', amount: -1, unit: '' }],
          });
        },
        ValidationError,
        'Invalid ingredient',
      );
    });

    it('should handle non-existent recipe', async () => {
      await assertRejects(
        async () => {
          await recipeService.updateRecipe('nonexistent-id', {
            title: 'Updated Title',
          });
        },
        AppError,
        'Recipe not found',
      );
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe', async () => {
      const recipe = await recipeService.createRecipe(createTestRecipeData());
      await recipeService.deleteRecipe(recipe._id);

      await assertRejects(
        async () => {
          await recipeService.getRecipeById(recipe._id);
        },
        AppError,
        'Recipe not found',
      );
    });

    it('should throw error for non-existent recipe', async () => {
      await assertRejects(
        async () => {
          await recipeService.deleteRecipe('nonexistent-id');
        },
        AppError,
        'Recipe not found',
      );
    });
  });
});
