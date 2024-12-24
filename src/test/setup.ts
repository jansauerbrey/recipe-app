import { loadTestConfig, cleanupTestConfig, setupTestDB, cleanupTestDB } from "./test_config.ts";

// Global setup and teardown
export async function setupTests() {
  await loadTestConfig();
  await setupTestDB();
}

export async function cleanupTests() {
  await cleanupTestDB();
  await cleanupTestConfig();
}

// Database setup and teardown
export { setupTestDB, cleanupTestDB };

// Export test utilities
export * from "./utils.ts";
export { assertEquals, assertRejects, assertThrows } from "std/testing/asserts.ts";
export { describe, it, beforeAll, afterAll } from "std/testing/bdd.ts";
