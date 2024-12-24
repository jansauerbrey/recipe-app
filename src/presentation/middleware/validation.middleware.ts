import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { parse } from "https://deno.land/std@0.208.0/yaml/mod.ts";
import { ValidationError } from "../../types/errors.ts";

// Read OpenAPI spec
const specPath = "./src/openapi/openapi.yaml";
const spec = parse(await Deno.readTextFile(specPath));

interface OpenAPISchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: OpenAPISchema;
}

// Helper to get schema for a specific path and method
function getRequestSchema(path: string, method: string): OpenAPISchema | null {
  const pathObj = spec.paths[path];
  if (!pathObj) return null;

  const methodObj = pathObj[method.toLowerCase()];
  if (!methodObj) return null;

  if (methodObj.requestBody?.content?.["application/json"]?.schema) {
    return methodObj.requestBody.content["application/json"].schema;
  }

  return null;
}

function getResponseSchema(path: string, method: string, status: number): OpenAPISchema | null {
  const pathObj = spec.paths[path];
  if (!pathObj) return null;

  const methodObj = pathObj[method.toLowerCase()];
  if (!methodObj) return null;

  const statusStr = status.toString();
  if (methodObj.responses?.[statusStr]?.content?.["application/json"]?.schema) {
    return methodObj.responses[statusStr].content["application/json"].schema;
  }

  return null;
}

// Validate data against schema
function validateAgainstSchema(data: unknown, schema: OpenAPISchema): string[] {
  const errors: string[] = [];

  if (!schema) return errors;

  // Type validation
  if (schema.type === "object") {
    if (typeof data !== "object" || data === null) {
      errors.push("Expected object type");
      return errors;
    }

    // Required properties
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in data)) {
          errors.push(`Missing required property: ${required}`);
        }
      }
    }

    // Property validation
    if (schema.properties) {
      for (const [key, value] of Object.entries(data)) {
        const propertySchema = schema.properties[key];
        if (propertySchema) {
          errors.push(...validateAgainstSchema(value, propertySchema));
        }
      }
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(data)) {
      errors.push("Expected array type");
      return errors;
    }

    if (schema.items) {
      for (const item of data) {
        errors.push(...validateAgainstSchema(item, schema.items));
      }
    }
  } else if (schema.type === "string") {
    if (typeof data !== "string") {
      errors.push("Expected string type");
    }
  } else if (schema.type === "number") {
    if (typeof data !== "number") {
      errors.push("Expected number type");
    }
  } else if (schema.type === "boolean") {
    if (typeof data !== "boolean") {
      errors.push("Expected boolean type");
    }
  }

  return errors;
}

// Middleware to validate requests
export function validateRequest() {
  return async (ctx: Context, next: () => Promise<void>) => {
    const path = ctx.request.url.pathname;
    const method = ctx.request.method;

    const schema = getRequestSchema(path, method);
    if (schema) {
      const body = await ctx.request.body().value;
      const errors = validateAgainstSchema(body, schema);
      
      if (errors.length > 0) {
        throw new ValidationError(`Request validation failed: ${errors.join(", ")}`);
      }
    }

    await next();
  };
}

// Middleware to validate responses
export function validateResponse() {
  return async (ctx: Context, next: () => Promise<void>) => {
    const path = ctx.request.url.pathname;
    const method = ctx.request.method;

    // Store original response body setter
    const originalBodySetter = Object.getOwnPropertyDescriptor(ctx.response, "body")?.set;
    if (!originalBodySetter) return await next();

    // Override response body setter
    Object.defineProperty(ctx.response, "body", {
      configurable: true,
      enumerable: true,
      get() {
        return this.body;
      },
      set(value) {
        const schema = getResponseSchema(path, method, ctx.response.status);
        if (schema) {
          const errors = validateAgainstSchema(value, schema);
          if (errors.length > 0) {
            console.error(`Response validation failed: ${errors.join(", ")}`);
            // In development, you might want to throw here
            // In production, logging might be more appropriate
          }
        }
        originalBodySetter.call(ctx.response, value);
      },
    });

    await next();

    // Restore original body setter
    Object.defineProperty(ctx.response, "body", {
      configurable: true,
      enumerable: true,
      set: originalBodySetter,
    });
  };
}
