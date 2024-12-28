/// <reference lib="deno.ns" />

import { Database } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';

// Use Deno's crypto API
declare global {
  interface Crypto {
    randomUUID(): string;
  }
}

// MongoDB types
export interface MongoDocument {
  _id?: string;
}

// Database type
export type TestDB = Database;

// Recipe test data types
export interface TestRecipe extends MongoDocument {
  id?: string;
  name: string;
  description: string;
  ingredients: TestIngredient[];
  steps: string[];
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestIngredient {
  name: string;
  amount: number;
  unit: string;
}

// Test data factory
export function createTestRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
  return {
    name: 'Test Recipe',
    description: 'A test recipe description',
    ingredients: [
      {
        name: 'Test Ingredient',
        amount: 100,
        unit: 'g'
      }
    ],
    steps: ['Step 1: Test step'],
    userId: 'test-user-id',
    ...overrides,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date()
  };
}

// Test data sets
export const recipeTestData = {
  validRecipes: [
    createTestRecipe({
      name: 'Recipe 1',
      userId: 'user-1'
    }),
    createTestRecipe({
      name: 'Recipe 2',
      userId: 'user-1'
    }),
    createTestRecipe({
      name: 'Recipe 3',
      userId: 'user-2'
    })
  ],
  invalidRecipes: {
    noName: createTestRecipe({ name: '' }),
    noIngredients: createTestRecipe({ ingredients: [] }),
    noSteps: createTestRecipe({ steps: [] }),
    invalidIngredient: createTestRecipe({
      ingredients: [{
        name: '',
        amount: -1,
        unit: ''
      }]
    })
  }
};

// Database helpers
export async function setupTestRecipes(db: TestDB) {
  const collection = db.collection('recipes');
  await collection.deleteMany({});
  
  // Insert test recipes
  for (const recipe of recipeTestData.validRecipes) {
    await collection.insertOne({
      ...recipe,
      _id: globalThis.crypto.randomUUID()
    });
  }
}

export async function cleanupTestRecipes(db: TestDB) {
  const collection = db.collection('recipes');
  await collection.deleteMany({});
}
