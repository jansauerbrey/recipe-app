import { Context } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { parse } from 'https://deno.land/std@0.208.0/yaml/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppMiddleware } from '../../types/middleware.ts';
import { ResourceNotFoundError } from '../../types/errors.ts';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    [key: string]: unknown;
  };
  paths: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Read and parse OpenAPI specification file
 */
async function readOpenApiSpec(): Promise<string> {
  try {
    return await Deno.readTextFile(
      join(Deno.cwd(), 'src', 'openapi', 'openapi.yaml'),
    );
  } catch (error: unknown) {
    throw new ResourceNotFoundError(
      `OpenAPI specification: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Parse YAML content to OpenAPI specification object
 */
function parseOpenApiSpec(content: string): OpenAPISpec {
  try {
    const spec = parse(content) as OpenAPISpec;
    if (!spec.openapi || !spec.info || !spec.paths) {
      throw new Error('Invalid OpenAPI specification format');
    }
    return spec;
  } catch (error: unknown) {
    throw new Error(
      `Failed to parse OpenAPI specification: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Middleware to serve OpenAPI/Swagger documentation
 */
export const swaggerMiddleware: AppMiddleware = async (
  ctx: Context,
  next: () => Promise<unknown>,
): Promise<void> => {
  const path = ctx.request.url.pathname;

  try {
    if (path === '/api-docs/swagger.yaml') {
      const yamlContent = await readOpenApiSpec();
      ctx.response.headers.set('Content-Type', 'text/yaml');
      ctx.response.body = yamlContent;
      return;
    }

    if (path === '/api-docs') {
      const yamlContent = await readOpenApiSpec();
      const spec = parseOpenApiSpec(yamlContent);
      ctx.response.headers.set('Content-Type', 'application/json');
      ctx.response.body = spec;
      return;
    }

    await next();
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError) {
      ctx.response.status = Status.NotFound;
      ctx.response.body = { error: error.message };
    } else {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        error: `Swagger documentation error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
};
