import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/testing/asserts.ts';
import { Database } from 'https://deno.land/x/mongo@v0.32.0/mod.ts';
import { TestRecipe, TestUser } from './factories.ts';
import { generateToken } from '../../presentation/middleware/auth.middleware.ts';

interface ErrorResponseBody {
  error: string;
  status: number;
}

/**
 * Assert that a user exists in the database
 */
export async function assertUserExists(db: Database, user: TestUser) {
  const users = db.collection('users');
  const foundUser = await users.findOne({ username: user.username });
  assertExists(foundUser, `User ${user.username} not found in database`);
  assertEquals(foundUser.role, user.role, 'User role does not match');
}

/**
 * Assert that a recipe exists in the database
 */
export async function assertRecipeExists(db: Database, recipe: TestRecipe) {
  const recipes = db.collection('recipes');
  const foundRecipe = await recipes.findOne({ title: recipe.title });
  assertExists(foundRecipe, `Recipe ${recipe.title} not found in database`);
  assertEquals(foundRecipe.description, recipe.description, 'Recipe description does not match');
  assertEquals(foundRecipe.userId, recipe.userId, 'Recipe userId does not match');
}

/**
 * Assert API error response
 */
export async function assertErrorResponse(response: Response, status: number, message?: string) {
  assertEquals(response.status, status, `Expected status ${status} but got ${response.status}`);
  if (message) {
    const body = await response.json() as ErrorResponseBody;
    assertEquals(
      body.error,
      message,
      `Expected error message "${message}" but got "${body.error}"`,
    );
  }
}

/**
 * Create authorization header with JWT token
 */
export async function createAuthHeader(userId: string, role = 'user'): Promise<HeadersInit> {
  const token = await generateToken(userId, role);
  return {
    'Authorization': `Bearer ${token.replace('AUTH ', '')}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Clean specific collections
 */
export async function cleanCollections(db: Database, collections: string[]) {
  for (const collection of collections) {
    await db.collection(collection).deleteMany({});
  }
}

/**
 * Compare dates ignoring milliseconds
 */
export function assertDateEquals(actual: Date | string, expected: Date | string, message?: string) {
  const actualDate = actual instanceof Date ? actual : new Date(actual);
  const expectedDate = expected instanceof Date ? expected : new Date(expected);

  assertEquals(
    Math.floor(actualDate.getTime() / 1000),
    Math.floor(expectedDate.getTime() / 1000),
    message || 'Dates do not match',
  );
}

/**
 * Assert object contains expected properties
 */
export function assertContains<T extends Record<string, unknown>>(
  actual: T,
  expected: Partial<T>,
  message?: string,
) {
  for (const [key, value] of Object.entries(expected)) {
    assertEquals(
      actual[key as keyof T],
      value,
      message || `Property "${key}" does not match expected value`,
    );
  }
}

/**
 * Assert successful API response
 */
export async function assertSuccessResponse<T>(
  response: Response,
  expectedStatus = 200,
): Promise<T> {
  assertEquals(
    response.status,
    expectedStatus,
    `Expected status ${expectedStatus} but got ${response.status}`,
  );
  const body = await response.json() as T;
  assertExists(body, 'Response body should not be null');
  return body;
}
