import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { parse } from 'https://deno.land/std@0.208.0/yaml/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppMiddleware, createMiddleware } from '../../types/middleware.ts';

interface OpenAPISpec {
  paths: {
    [path: string]: {
      [method: string]: {
        parameters?: Array<{
          name: string;
          in: string;
          required?: boolean;
          schema?: unknown;
        }>;
        requestBody?: {
          required?: boolean;
          content: {
            [contentType: string]: {
              schema: unknown;
            };
          };
        };
        responses: {
          [statusCode: string]: {
            content?: {
              [contentType: string]: {
                schema: unknown;
              };
            };
          };
        };
      };
    };
  };
}

let openApiSpec: OpenAPISpec | null = null;

async function loadOpenApiSpec(): Promise<OpenAPISpec> {
  if (openApiSpec) return openApiSpec;

  try {
    const yamlContent = await Deno.readTextFile(
      join(Deno.cwd(), 'src', 'openapi', 'openapi.yaml'),
    );
    openApiSpec = parse(yamlContent) as OpenAPISpec;
    return openApiSpec;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    throw new Error(`Failed to load OpenAPI spec: ${error.message}`);
  }
}

export const validateRequest = createMiddleware(async (ctx, next) => {
  try {
    const spec = await loadOpenApiSpec();
    const path = ctx.request.url.pathname;
    const method = ctx.request.method.toLowerCase();

    const pathObj = spec.paths[path];
    if (!pathObj || !pathObj[method]) {
      await next();
      return;
    }

    const operation = pathObj[method];

    // Validate parameters
    if (operation.parameters) {
      for (const param of operation.parameters) {
        if (param.required) {
          let value;
          switch (param.in) {
            case 'path':
              value = ctx.params[param.name];
              break;
            case 'query':
              value = ctx.request.url.searchParams.get(param.name);
              break;
            case 'header':
              value = ctx.request.headers.get(param.name);
              break;
          }

          if (!value) {
            ctx.response.status = Status.BadRequest;
            ctx.response.body = {
              error: `Missing required ${param.in} parameter: ${param.name}`,
            };
            return;
          }
        }
      }
    }

    // Validate request body
    if (operation.requestBody?.required) {
      const contentType = ctx.request.headers.get('content-type') || 'application/json';
      const bodySchema = operation.requestBody.content[contentType]?.schema;

      if (bodySchema) {
        try {
          const body = ctx.request.body();
          const value = await body.value;
          // Here you would validate the body against the schema
          // For now, we just check if it exists
          if (!value) {
            ctx.response.status = Status.BadRequest;
            ctx.response.body = { error: 'Missing required request body' };
            return;
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          ctx.response.status = Status.BadRequest;
          ctx.response.body = { error: `Invalid request body: ${error.message}` };
          return;
        }
      }
    }

    await next();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = { error: `Validation error: ${error.message}` };
  }
});

export const validateResponse = createMiddleware(async (ctx, next) => {
  try {
    await next();

    const spec = await loadOpenApiSpec();
    const path = ctx.request.url.pathname;
    const method = ctx.request.method.toLowerCase();

    const pathObj = spec.paths[path];
    if (!pathObj || !pathObj[method]) {
      return;
    }

    const operation = pathObj[method];
    const responseSpec = operation.responses[ctx.response.status.toString()];

    if (responseSpec?.content) {
      const contentType = ctx.response.headers.get('content-type') || 'application/json';
      const schema = responseSpec.content[contentType]?.schema;

      if (schema) {
        // Here you would validate the response against the schema
        // For now, we just check if it exists when required
        if (!ctx.response.body && ctx.response.status !== Status.NoContent) {
          throw new Error('Missing response body');
        }
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = { error: `Response validation error: ${error.message}` };
  }
});
