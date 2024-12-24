/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals, assertRejects } from "std/testing/asserts.ts";
import { setupTest, cleanupTest } from "../test_utils.ts";
import { createAuthContext, authTestData, type AuthContext } from "./test_helpers.ts";

// Type guard for user state
function hasUser(state: Record<string, unknown>): state is { user: { id: string; role: string } } {
  return state.user !== undefined && 
    typeof (state.user as any).id === 'string' && 
    typeof (state.user as any).role === 'string';
}

// Auth middleware implementation
async function authMiddleware(ctx: AuthContext, next: () => Promise<void>) {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer") {
    throw new Error("Invalid authorization type");
  }

  if (token === authTestData.validToken) {
    ctx.state.user = authTestData.users.regular;
    await next();
  } else {
    throw new Error("Invalid token");
  }
}

Deno.test({
  name: "Auth Middleware Tests",
  async fn(t) {
    await setupTest();

    await t.step("should pass with valid token", async () => {
      const ctx = createAuthContext({ token: authTestData.validToken });

      let nextCalled = false;
      await authMiddleware(ctx, async () => {
        nextCalled = true;
      });

      assertEquals(nextCalled, true);
      if (!hasUser(ctx.state)) {
        throw new Error("User not set in state");
      }
      const user = ctx.state.user;
      if (!user) {
        throw new Error("User not set in state");
      }
      assertEquals(user.id, "test-user-id");
      assertEquals(user.role, "user");
    });

    await t.step("should reject missing auth header", async () => {
      const ctx = createAuthContext();

      await assertRejects(
        () => authMiddleware(ctx, async () => {}),
        Error,
        "No authorization header"
      );
    });

    await t.step("should reject invalid token", async () => {
      const ctx = createAuthContext({ token: authTestData.invalidToken });

      await assertRejects(
        () => authMiddleware(ctx, async () => {}),
        Error,
        "Invalid token"
      );
    });

    await cleanupTest();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
