import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'https://deno.land/std@0.208.0/testing/bdd.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { cleanupTest, setupTest } from './test_utils.ts';
import { TestContext } from './test_utils.ts';

let testContext: TestContext;

beforeAll(async () => {
  testContext = await setupTest();
});

afterAll(async () => {
  await cleanupTest();
});

beforeEach(async () => {
  // Reset database state
  const db = testContext.mongoClient.database('recipe_app_test');
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
});

export { afterAll, assertEquals, assertExists, beforeAll, beforeEach, describe, it };
export { testContext };
