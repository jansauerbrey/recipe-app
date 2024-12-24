#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Recipe App...${NC}\n"

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo -e "${RED}Error: Deno is not installed${NC}"
    echo "Please install Deno first: https://deno.land/#installation"
    exit 1
fi

# Check Deno version
DENO_VERSION=$(deno --version | head -n 1 | cut -d ' ' -f 2)
REQUIRED_VERSION="1.37"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$DENO_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then 
    echo -e "${GREEN}✓ Deno version $DENO_VERSION${NC}"
else
    echo -e "${YELLOW}Warning: Deno version $DENO_VERSION might be too old. Required: $REQUIRED_VERSION${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}Please update the values in .env with your configuration${NC}"
fi

# Create upload directory
if [ ! -d "upload" ]; then
    echo -e "\n${YELLOW}Creating upload directory...${NC}"
    mkdir upload
    echo -e "${GREEN}✓ Created upload directory${NC}"
fi

# Install dependencies (cache Deno modules)
echo -e "\n${YELLOW}Caching Deno dependencies...${NC}"
deno cache app.ts
echo -e "${GREEN}✓ Dependencies cached${NC}"

# Generate types
echo -e "\n${YELLOW}Generating TypeScript types...${NC}"
deno task generate-types
echo -e "${GREEN}✓ Types generated${NC}"

# Validate environment
echo -e "\n${YELLOW}Validating environment...${NC}"
deno task validate-env
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Environment validated${NC}"
else
    echo -e "${RED}✗ Environment validation failed${NC}"
    echo "Please check your .env configuration"
    exit 1
fi

# Format code
echo -e "\n${YELLOW}Formatting code...${NC}"
deno task fmt
echo -e "${GREEN}✓ Code formatted${NC}"

# Run linter
echo -e "\n${YELLOW}Running linter...${NC}"
deno task lint
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${RED}✗ Linting failed${NC}"
    echo "Please fix the linting errors and try again"
    exit 1
fi

echo -e "\n${GREEN}Setup completed successfully!${NC}"
echo -e "\nTo start the development server:"
echo -e "  ${YELLOW}deno task dev${NC}"
echo -e "\nTo access the API documentation:"
echo -e "  ${YELLOW}http://localhost:3000/api-docs${NC}"
echo -e "\nMake sure to:"
echo -e "1. Configure your MongoDB connection in .env"
echo -e "2. Set a secure JWT_SECRET in .env"
echo -e "3. Update ALLOWED_ORIGINS in .env if needed\n"
