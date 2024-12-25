#!/bin/bash

echo "Running all tests..."

# Kill any lingering deno processes
pkill -f "deno" || true

# Add a delay to ensure ports are freed
sleep 2

# Run all tests with trace leaks enabled
deno test \
  --allow-net \
  --allow-read \
  --allow-env \
  --allow-write \
  --trace-leaks \
  --fail-fast \
  "src/test/**/*.test.ts"

# Check if tests failed
if [ $? -ne 0 ]; then
  echo "Tests failed"
  exit 1
fi

echo "All tests completed successfully"
