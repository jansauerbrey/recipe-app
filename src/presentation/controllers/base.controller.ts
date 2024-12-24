import { Context, Status } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export abstract class BaseController {
  protected async json(ctx: Context, status: number, data: unknown) {
    ctx.response.status = status;
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
    ctx.response.headers.set("Access-Control-Expose-Headers", "Authorization, AUTH");
    ctx.response.body = data;
  }

  protected async ok(ctx: Context, data: unknown) {
    await this.json(ctx, Status.OK, data);
  }

  protected async created(ctx: Context, data: unknown) {
    await this.json(ctx, Status.Created, data);
  }

  protected async noContent(ctx: Context) {
    ctx.response.status = Status.NoContent;
  }

  protected async badRequest(ctx: Context, message: string) {
    await this.json(ctx, Status.BadRequest, {
      error: message,
    });
  }

  protected async unauthorized(ctx: Context, message = "Unauthorized") {
    await this.json(ctx, Status.Unauthorized, {
      error: message,
    });
  }

  protected async forbidden(ctx: Context, message = "Forbidden") {
    await this.json(ctx, Status.Forbidden, {
      error: message,
    });
  }

  protected async notFound(ctx: Context, message = "Not Found") {
    await this.json(ctx, Status.NotFound, {
      error: message,
    });
  }

  protected async internalServerError(
    ctx: Context,
    message = "Internal Server Error"
  ) {
    await this.json(ctx, Status.InternalServerError, {
      error: message,
    });
  }

  protected getAuthToken(ctx: Context): string | null {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader) return null;

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) return null;

    return token;
  }

  protected async getRequestBody<T>(ctx: Context): Promise<T | null> {
    try {
      const body = ctx.request.body();
      if (body.type !== "json") return null;
      return await body.value as T;
    } catch {
      return null;
    }
  }

  protected getQueryParam(ctx: Context, name: string): string | null {
    const params = new URLSearchParams(ctx.request.url.search);
    return params.get(name);
  }
}
