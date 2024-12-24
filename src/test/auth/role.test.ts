/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { assertEquals, assertRejects } from "std/testing/asserts.ts";
import { setupTest, cleanupTest } from "../test_utils.ts";
import { createAuthContext, authTestData, type AuthContext } from "./test_helpers.ts";

// Role middleware implementation
function checkRole(allowedRoles: string[]) {
  return async function roleMiddleware(ctx: AuthContext, next: () => Promise<void>) {
    const user = ctx.state.user;
    if (!user) {
      throw new Error("Unauthorized - no user in context");
    }

    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Access denied - requires one of roles: ${allowedRoles.join(", ")}`);
    }

    await next();
  };
}

Deno.test({
  name: "Role Authorization Tests",
  async fn(t) {
    await setupTest();

    await t.step("should allow user with correct role", async () => {
      const ctx = createAuthContext({ role: "admin" });
      const roleMiddleware = checkRole(["admin", "superadmin"]);

      let nextCalled = false;
      await roleMiddleware(ctx, async () => {
        nextCalled = true;
      });

      assertEquals(nextCalled, true);
    });

    await t.step("should reject user with incorrect role", async () => {
      const ctx = createAuthContext({ role: "user" });
      const roleMiddleware = checkRole(["admin"]);

      await assertRejects(
        () => roleMiddleware(ctx, async () => {}),
        Error,
        "Access denied"
      );
    });

    await t.step("should reject request with no user", async () => {
      const ctx = createAuthContext();
      const roleMiddleware = checkRole(["admin"]);

      await assertRejects(
        () => roleMiddleware(ctx, async () => {}),
        Error,
        "Unauthorized"
      );
    });

    await t.step("should handle multiple allowed roles", async () => {
      const ctx = createAuthContext({ role: "editor" });
      const roleMiddleware = checkRole(["admin", "editor", "moderator"]);

      let nextCalled = false;
      await roleMiddleware(ctx, async () => {
        nextCalled = true;
      });

      assertEquals(nextCalled, true);
    });

    await cleanupTest();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
