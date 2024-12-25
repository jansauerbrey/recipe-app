import { Context, RouterContext } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { parse } from 'https://deno.land/std@0.208.0/yaml/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { Status } from 'https://deno.land/std@0.208.0/http/http_status.ts';
import { AppMiddleware } from '../../types/middleware.ts';
import { ValidationError } from '../../types/errors.ts';

interface OpenAPIParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required?: boolean;
  schema?: unknown;
}

interface OpenAPIRequestBody {
  required?: boolean;
  content: {
    [contentType: string]: {
      schema: unknown;
    };
  };
}

interface OpenAPIResponse {
  content?: {
    [contentType: string]: {
      schema: unknown;
    };
  };
}

interface OpenAPIOperation {
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: {
    [statusCode: string]: OpenAPIResponse;
  };
}

interface OpenAPIPathItem {
  [method: string]: OpenAPIOperation;
}

interface OpenAPISpec {
  paths: {
    [path: string]: OpenAPIPathItem;
  };
}

let cachedSpec: OpenAPISpec | null = null;

/**
 * Load and parse the OpenAPI specification file
 */
async function loadOpenApiSpec(): Promise<OpenAPISpec> {
  if (cachedSpec) {
    return cachedSpec;
  }

  try {
    const yamlContent = await Deno.readTextFile(
      join(Deno.cwd(), 'src', 'openapi', 'openapi.yaml'),
    );
    cachedSpec = parse(yamlContent) as OpenAPISpec;
    return cachedSpec;
  } catch (error: unknown) {
    throw new Error(
      `Failed to load OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get parameter value from the appropriate location in the request
 */
function getParameterValue(
  ctx: RouterContext<string>,
  param: OpenAPIParameter,
): string | null {
  switch (param.in) {
  case 'path':
    return ctx.params[param.name] ?? null;
  case 'query':
    return ctx.request.url.searchParams.get(param.name);
  case 'header':
    return ctx.request.headers.get(param.name);
  default:
    return null;
  }
}

/**
 * Middleware to validate incoming requests against OpenAPI specification
 */
export const validateRequest: AppMiddleware = async (
  ctx: Context,
  next: () => Promise<unknown>,
): Promise<void> => {
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
        const value = getParameterValue(ctx as RouterContext<string>, param);
        if (!value) {
          throw new ValidationError(
            `Missing required ${param.in} parameter: ${param.name}`
          );
        }
      }
    }
  }

  // Validate request body
  if (operation.requestBody?.required) {
    const contentType = ctx.request.headers.get('content-type') ?? 'application/json';
    const bodySchema = operation.requestBody.content[contentType]?.schema;

    if (bodySchema) {
      try {
        const body = ctx.request.body();
        const value = await body.value;
        if (!value) {
          throw new ValidationError('Missing required request body');
        }
        // TODO: Add schema validation when needed
      } catch (error: unknown) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError(
          `Invalid request body: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  await next();
};

/**
 * Middleware to validate outgoing responses against OpenAPI specification
 */
export const validateResponse: AppMiddleware = async (
  ctx: Context,
  next: () => Promise<unknown>,
): Promise<void> => {
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
    const contentType = ctx.response.headers.get('content-type') ?? 'application/json';
    const schema = responseSpec.content[contentType]?.schema;

    if (schema && !ctx.response.body && ctx.response.status !== Status.NoContent) {
      throw new ValidationError('Missing response body');
    }
    // TODO: Add schema validation when needed
  }
};
