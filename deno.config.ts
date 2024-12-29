import { CompilerOptions } from 'https://deno.land/x/deno_emit@0.8.0/mod.ts';

const config: CompilerOptions = {
  allowJs: true,
  lib: ['deno.window', 'deno.ns', 'dom'],
  strict: true,
  experimentalDecorators: true,
  emitDecoratorMetadata: true,
  baseUrl: '.',
  paths: {
    'src/*': ['./src/*'],
    'oak': ['https://deno.land/x/oak@v12.6.1/mod.ts'],
    'oak/*': ['https://deno.land/x/oak@v12.6.1/*'],
    'dotenv': ['https://deno.land/std@0.208.0/dotenv/mod.ts'],
    'cors': ['https://deno.land/x/cors@v1.2.2/mod.ts'],
    'mongo': ['https://deno.land/x/mongo@v0.32.0/mod.ts'],
    'oak_rate_limit': ['https://deno.land/x/oak_rate_limit@v0.1.1/mod.ts'],
    'http/*': ['https://deno.land/std@0.208.0/http/*'],
    'djwt': ['https://deno.land/x/djwt@v3.0.1/mod.ts'],
  },
};

export default config;
