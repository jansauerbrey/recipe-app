import { Recipe, User } from '../../types/mod.ts';

export type TestRecipe = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;
export type TestUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export function createTestRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
  return {
    title: 'Test Recipe',
    description: 'A test recipe description',
    ingredients: [
      {
        name: 'Test Ingredient',
        amount: 1,
        unit: 'cup',
      },
    ],
    instructions: ['Step 1: Test instruction'],
    tags: [],
    userId: 'test-user-id',
    ...overrides,
  };
}

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    email: 'test@example.com',
    password: 'test-password',
    username: 'Test User',
    role: 'user',
    ...overrides,
  };
}
