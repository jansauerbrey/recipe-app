#!/bin/bash

# Function to print usage
print_usage() {
    echo "Usage: $0 [options] [test-type]"
    echo ""
    echo "Options:"
    echo "  --coverage    Generate test coverage report"
    echo "  --filter      Filter tests by pattern"
    echo ""
    echo "Test Types:"
    echo "  unit         Run unit tests only"
    echo "  integration  Run integration tests only"
    echo "  e2e          Run end-to-end tests only"
    echo "  all          Run all tests (default)"
}

# Initialize variables
COVERAGE=""
FILTER=""
PATTERN="src/test/**/*.test.ts"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE_DIR="coverage"
            mkdir -p $COVERAGE_DIR
            COVERAGE="--coverage=$COVERAGE_DIR"
            shift
            ;;
        --filter)
            FILTER="--filter $2"
            shift
            shift
            ;;
        unit)
            PATTERN="src/test/unit/**/*.test.ts"
            shift
            ;;
        integration)
            PATTERN="src/test/integration/**/*.test.ts"
            shift
            ;;
        e2e)
            PATTERN="src/test/e2e/**/*.test.ts"
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Load test environment variables
if [ -f ".env.test" ]; then
    export $(cat .env.test | grep -v '^#' | xargs)
fi

# Run tests
echo "Running tests: $PATTERN"
deno test \
  --allow-net \
  --allow-read \
  --allow-env \
  --allow-write \
  --config=deno.test.config.json \
  --import-map=import_map.test.json \
  --parallel \
  $COVERAGE \
  $FILTER \
  $PATTERN

# Generate coverage report if requested
if [ ! -z "$COVERAGE" ]; then
    echo "Generating coverage report..."
    deno coverage $COVERAGE_DIR --lcov > $COVERAGE_DIR/coverage.lcov
    echo "Coverage report generated at $COVERAGE_DIR/coverage.lcov"
fi
