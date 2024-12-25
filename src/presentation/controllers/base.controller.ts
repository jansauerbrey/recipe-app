import { Response } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppRouterContext } from '../../types/middleware.ts';

export type ControllerContext = AppRouterContext;
type ResponseBody = Response['body'];

export abstract class BaseController {
  protected async ok(ctx: ControllerContext, data: ResponseBody): Promise<void> {
    ctx.response.status = Status.OK;
    ctx.response.body = data;
  }

  protected async created(ctx: ControllerContext, data: ResponseBody): Promise<void> {
    ctx.response.status = Status.Created;
    ctx.response.body = data;
  }

  protected async noContent(ctx: ControllerContext): Promise<void> {
    ctx.response.status = Status.NoContent;
  }

  protected async badRequest(ctx: ControllerContext, message: string): Promise<void> {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = { error: message };
  }

  protected async unauthorized(ctx: ControllerContext, message: string): Promise<void> {
    ctx.response.status = Status.Unauthorized;
    ctx.response.body = { error: message };
  }

  protected async forbidden(ctx: ControllerContext, message: string): Promise<void> {
    ctx.response.status = Status.Forbidden;
    ctx.response.body = { error: message };
  }

  protected async notFound(ctx: ControllerContext, message: string): Promise<void> {
    ctx.response.status = Status.NotFound;
    ctx.response.body = { error: message };
  }

  protected async conflict(ctx: ControllerContext, message: string): Promise<void> {
    ctx.response.status = Status.Conflict;
    ctx.response.body = { error: message };
  }

  protected async internalServerError(ctx: ControllerContext, message: string): Promise<void> {
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = { error: message };
  }
}
