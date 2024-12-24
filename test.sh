#!/bin/bash

# Run tests with Deno
deno test \
  --allow-net \
  --allow-read \
  --allow-env \
  --allow-write \
  --config=deno.test.config.json \
  --import-map=import_map.test.json \
  --no-check \
  src/test/**/*.test.ts "$@"
