import { ObjectId } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

export interface TestUser {
  _id?: ObjectId;
  username: string;
  password: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestRecipe {
  _id?: ObjectId;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  instructions: string[];
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a test user object
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const now = new Date();
  return {
    username: `testuser_${Math.random().toString(36).substring(7)}`,
    password: '$2a$10$K8ZpdrjwzUWSTmtyM.SAHewu7Zxpq3kUXnv/DPZSM8k.DSrmSekxi', // 'testpass'
    role: 'user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test recipe object
 */
export function createTestRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
  const now = new Date();
  return {
    title: 'Test Recipe',
    description: 'Test Description',
    ingredients: [
      {
        name: 'Test Ingredient',
        amount: 100,
        unit: 'g',
      },
    ],
    instructions: ['Step 1', 'Step 2'],
    userId: new ObjectId().toString(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create multiple test recipes
 */
export function createTestRecipes(
  count: number,
  overrides: Partial<TestRecipe> = {},
): TestRecipe[] {
  return Array.from({ length: count }, (_, index) => ({
    ...createTestRecipe(),
    title: `Test Recipe ${index + 1}`,
    description: `Test Description ${index + 1}`,
    ...overrides,
  }));
}

/**
 * Create a test admin user
 */
export function createTestAdmin(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({
    username: 'admin',
    role: 'admin',
    ...overrides,
  });
}

/**
 * Create test data for a complete recipe scenario
 */
export function createTestRecipeScenario() {
  const user = createTestUser();
  const recipes = createTestRecipes(3, { userId: user._id?.toString() });

  return {
    user,
    recipes,
  };
}
