import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { parse } from 'https://deno.land/std@0.208.0/yaml/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppMiddleware, createMiddleware } from '../../types/middleware.ts';

export const swaggerMiddleware: AppMiddleware = createMiddleware(async (ctx, next) => {
  const path = ctx.request.url.pathname;

  if (path === '/api-docs/swagger.yaml') {
    try {
      const yamlContent = await Deno.readTextFile(
        join(Deno.cwd(), 'src', 'openapi', 'openapi.yaml'),
      );
      ctx.response.headers.set('Content-Type', 'text/yaml');
      ctx.response.body = yamlContent;
      return;
    } catch (error) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = { error: 'Swagger documentation not found' };
      return;
    }
  }

  if (path === '/api-docs') {
    try {
      const yamlContent = await Deno.readTextFile(
        join(Deno.cwd(), 'src', 'openapi', 'openapi.yaml'),
      );
      const spec = parse(yamlContent) as Record<string, unknown>;
      ctx.response.headers.set('Content-Type', 'application/json');
      ctx.response.body = spec;
      return;
    } catch (error) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = { error: 'Swagger documentation not found' };
      return;
    }
  }

  await next();
});
