import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.208.0/testing/bdd.ts";
import { Status } from "https://deno.land/std@0.208.0/http/http_status.ts";
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { authMiddleware } from "../../../presentation/middleware/auth.middleware.ts";
import { AppRouterContext } from "../../../types/middleware.ts";

describe("Auth Middleware", () => {
  it("should return 401 when no token is provided", async () => {
    const ctx = {
      request: {
        headers: new Headers(),
      },
      response: {
        status: 0,
        body: {},
        headers: new Headers(),
      },
      state: {},
    } as unknown as AppRouterContext;

    await authMiddleware(ctx, async () => {});

    assertEquals(ctx.response.status, Status.Unauthorized);
    assertEquals(ctx.response.body, { error: "No authorization token provided" });
  });

  it("should return 401 when invalid token is provided", async () => {
    const ctx = {
      request: {
        headers: new Headers({
          Authorization: "Bearer invalid-token",
        }),
      },
      response: {
        status: 0,
        body: {},
        headers: new Headers(),
      },
      state: {},
    } as unknown as AppRouterContext;

    await authMiddleware(ctx, async () => {});

    assertEquals(ctx.response.status, Status.Unauthorized);
    assertEquals(ctx.response.body, { error: "Invalid token" });
  });

  it("should call next middleware when valid token is provided", async () => {
    let nextCalled = false;
    const ctx = {
      request: {
        headers: new Headers({
          Authorization: "Bearer valid-token",
        }),
      },
      response: {
        status: 0,
        body: {},
        headers: new Headers(),
      },
      state: {
        user: undefined,
      },
    } as unknown as AppRouterContext;

    const next = async () => {
      nextCalled = true;
      ctx.state.user = { id: "test-user-id", role: "user" };
    };

    await authMiddleware(ctx, next);

    assertEquals(nextCalled, true);
    assertEquals(ctx.state.user?.id, "test-user-id");
  });
});
