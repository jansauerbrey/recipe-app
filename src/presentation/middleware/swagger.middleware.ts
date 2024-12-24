import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { parse } from "https://deno.land/std@0.208.0/yaml/mod.ts";

// Read and parse OpenAPI spec
const specPath = "./src/openapi/openapi.yaml";
const spec = parse(await Deno.readTextFile(specPath));

// Swagger UI HTML template
const swaggerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Recipe App API Documentation" />
    <title>Recipe App API - Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" crossorigin></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                spec: ${JSON.stringify(spec)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout",
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                defaultModelsExpandDepth: 3,
                defaultModelExpandDepth: 3,
                defaultModelRendering: 'model',
                docExpansion: 'list',
                showMutatedRequest: true,
                tryItOutEnabled: true
            });
        };
    </script>
    <style>
        .swagger-ui .topbar { display: none }
    </style>
</body>
</html>
`;

// Middleware to serve Swagger UI
export function swaggerMiddleware() {
  return async (ctx: Context, next: () => Promise<void>) => {
    if (ctx.request.url.pathname === "/api-docs") {
      ctx.response.headers.set("Content-Type", "text/html");
      ctx.response.body = swaggerHTML;
      return;
    }

    if (ctx.request.url.pathname === "/api-docs/openapi.json") {
      ctx.response.headers.set("Content-Type", "application/json");
      ctx.response.body = spec;
      return;
    }

    await next();
  };
}

// Helper to validate request against OpenAPI spec
export function validateRequest(path: string, method: string, body: unknown) {
  // TODO: Implement request validation against OpenAPI schema
  // This would check if the request matches the schema defined in the spec
  return true;
}

// Helper to validate response against OpenAPI spec
export function validateResponse(path: string, method: string, statusCode: number, body: unknown) {
  // TODO: Implement response validation against OpenAPI schema
  // This would check if the response matches the schema defined in the spec
  return true;
}
