import { parse } from 'https://deno.land/std@0.208.0/yaml/mod.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';

interface Schema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: Schema;
  $ref?: string;
}

interface OpenAPISpec {
  components: {
    schemas: Record<string, Schema>;
  };
  paths: Record<string, any>;
}

function resolveRef(ref: string, spec: OpenAPISpec): Schema {
  const path = ref.replace('#/components/schemas/', '');
  return spec.components.schemas[path];
}

function generateType(name: string, schema: Schema, spec: OpenAPISpec): string {
  if (schema.$ref) {
    schema = resolveRef(schema.$ref, spec);
  }

  let properties: string;
  let itemType: string;

  switch (schema.type) {
  case 'object':
    properties = Object.entries(schema.properties || {})
      .map(([key, value]) => {
        const isRequired = schema.required?.includes(key);
        const typeDeclaration = generateType(key, value, spec);
        return `  ${key}${isRequired ? '' : '?'}: ${typeDeclaration};`;
      })
      .join('\n');
    return `{\n${properties}\n}`;

  case 'array':
    if (schema.items) {
      itemType = generateType('item', schema.items, spec);
      return `${itemType}[]`;
    }
    return 'any[]';

  case 'string':
    return 'string';

  case 'number':
    return 'number';

  case 'boolean':
    return 'boolean';

  default:
    return 'any';
  }
}

function generateInterface(name: string, schema: Schema, spec: OpenAPISpec): string {
  const type = generateType(name, schema, spec);
  return `export interface ${name} ${type}\n`;
}

function generateRequestType(path: string, method: string, spec: OpenAPISpec): string {
  const operation = spec.paths[path][method];
  if (!operation) return '';

  const requestBody = operation.requestBody?.content?.['application/json']?.schema;
  if (!requestBody) return '';

  const name = `${method.charAt(0).toUpperCase() + method.slice(1)}${path
    .split('/')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')}Request`;

  return generateInterface(name, requestBody, spec);
}

function generateResponseType(path: string, method: string, spec: OpenAPISpec): string {
  const operation = spec.paths[path][method];
  if (!operation) return '';

  const successResponse = operation.responses?.['200']?.content?.['application/json']?.schema;
  if (!successResponse) return '';

  const name = `${method.charAt(0).toUpperCase() + method.slice(1)}${path
    .split('/')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')}Response`;

  return generateInterface(name, successResponse, spec);
}

async function main(): Promise<void> {
  // Read OpenAPI spec
  const specPath = join(Deno.cwd(), 'src', 'openapi', 'openapi.yaml');
  const spec = parse(await Deno.readTextFile(specPath)) as OpenAPISpec;

  let output = '// Generated types from OpenAPI specification\n\n';

  // Generate types for schemas
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    output += generateInterface(name, schema, spec);
    output += '\n';
  }

  // Generate types for requests and responses
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const method of Object.keys(methods)) {
      output += generateRequestType(path, method, spec);
      output += generateResponseType(path, method, spec);
    }
  }

  // Write output to types file
  const typesPath = join(Deno.cwd(), 'src', 'types', 'api.ts');
  await Deno.writeTextFile(typesPath, output);

  console.log('Generated API types successfully!');
}

if (import.meta.main) {
  main().catch(console.error);
}
