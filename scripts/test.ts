#!/usr/bin/env -S deno test --allow-net --allow-read --allow-env --allow-write --config=deno.test.config.json --import-map=import_map.test.json

// Import test files directly
import "../src/test/presentation/middleware/auth.test.ts";
// Add more test imports here as needed
