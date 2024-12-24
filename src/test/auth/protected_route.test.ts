/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals, assertRejects } from "std/testing/asserts.ts";
import { setupTest, cleanupTest } from "../test_utils.ts";
import { createAuthContext, authTestData, type AuthContext } from "./test_helpers.ts";

// Protected route handler implementation
function createProtectedRoute(
  handler: (ctx: AuthContext) => Promise<unknown>,
  allowedRoles: string[] = []
) {
  return async function protectedRoute(ctx: AuthContext): Promise<unknown> {
    // Check authentication
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer") {
      throw new Error("Invalid authorization type");
    }

    if (token !== authTestData.validToken) {
      throw new Error("Invalid token");
    }

    // Set user in context for valid token
    ctx.state.user = ctx.state.user || authTestData.users.regular;

    // Check role if specified
    if (allowedRoles.length > 0) {
      const user = ctx.state.user;
      if (!user) {
        throw new Error("Unauthorized - no user in context");
      }
      if (!allowedRoles.includes(user.role)) {
        throw new Error(`Access denied - requires one of roles: ${allowedRoles.join(", ")}`);
      }
    }

    // Call actual handler
    return await handler(ctx);
  };
}

Deno.test({
  name: "Protected Route Tests",
  async fn(t) {
    await setupTest();

    await t.step("should handle authenticated request", async () => {
      const ctx = createAuthContext({ token: authTestData.validToken });
      const protectedHandler = createProtectedRoute(async (ctx) => "success");

      const result = await protectedHandler(ctx);
      assertEquals(result, "success");
      const user = ctx.state.user;
      if (!user) {
        throw new Error("User not set in state");
      }
      assertEquals(user.role, "user");
    });

    await t.step("should reject unauthenticated request", async () => {
      const ctx = createAuthContext();
      const protectedHandler = createProtectedRoute(async (ctx) => "success");

      await assertRejects(
        () => protectedHandler(ctx),
        Error,
        "No authorization header"
      );
    });

    await t.step("should handle role-protected route with correct role", async () => {
      const ctx = createAuthContext({ token: authTestData.validToken });
      ctx.state.user = authTestData.users.admin;
      const protectedHandler = createProtectedRoute(
        async (ctx) => "admin success",
        ["admin"]
      );

      const result = await protectedHandler(ctx);
      assertEquals(result, "admin success");
    });

    await t.step("should reject request with incorrect role", async () => {
      const ctx = createAuthContext({ token: authTestData.validToken });
      ctx.state.user = authTestData.users.regular;
      const protectedHandler = createProtectedRoute(
        async (ctx) => "admin only",
        ["admin"]
      );

      await assertRejects(
        () => protectedHandler(ctx),
        Error,
        "Access denied"
      );
    });

    await cleanupTest();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
