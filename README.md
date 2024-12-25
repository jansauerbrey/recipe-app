# Recipe App API

A modern recipe management API built with Deno and Oak, featuring comprehensive API documentation, request/response validation, and robust authentication.

## Features

- 🔐 JWT-based authentication with role-based access control
- 📚 OpenAPI/Swagger documentation
- ✅ Request/response validation against OpenAPI schemas
- 🚦 Rate limiting protection
- 📁 File upload handling with validation
- 🔄 Auto-generated TypeScript types from OpenAPI spec
- 🛡️ Security headers and CORS configuration
- 🗃️ MongoDB integration with typed repositories
- 🧱 Clean architecture with separation of concerns

## Getting Started

### Prerequisites

- Deno 1.37 or higher
- MongoDB 5.0 or higher
- Node.js 18+
- Android Studio (for Android app development)

### Quick Start

1. Clone the repository:

```bash
git clone https://github.com/yourusername/recipe-app.git
cd recipe-app
```

2. Run the setup script:

```bash
./setup.sh
```

The setup script will:

- Check Deno installation and version
- Create and configure .env file
- Set up upload directory
- Cache dependencies
- Generate TypeScript types from OpenAPI spec
- Validate environment configuration
- Format code and run linter

3. Start the development server:

```bash
deno task dev
```

### Manual Installation

If you prefer to set up manually:

1. Create and configure .env file:

```bash
cp .env.example .env
```

2. Install dependencies and generate types:

```bash
deno cache app.ts
deno task generate-types
```

3. Validate your configuration:

```bash
deno task validate-env
```

### Development Commands

```bash
# Start development server
deno task dev

# Start production server
deno task start

# Generate API types from OpenAPI spec
deno task generate-types

# Validate environment configuration
deno task validate-env

# Format code
deno task fmt

# Run linter
deno task lint

# Build project (validates env, generates types, formats, and lints)
deno task build
```

### API Documentation

Access the Swagger UI documentation at:

```
http://localhost:3000/api-docs
```

## Project Structure

```
├── src/
│   ├── business/           # Business logic layer
│   │   └── services/       # Service implementations
│   ├── data/              # Data access layer
│   │   └── repositories/   # MongoDB repositories
│   ├── presentation/      # Presentation layer
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Custom middleware
│   │   └── routes/        # Route definitions
│   ├── types/            # TypeScript types and interfaces
│   └── openapi/          # OpenAPI documentation
├── scripts/              # Build and utility scripts
└── android/            # Native Android app (Capacitor)
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: AUTH <token>
```

## API Endpoints

### Authentication

- POST /api/user/login - Authenticate user
- GET /api/user/check - Validate token

### Recipes

- GET /api/recipes - List user recipes
- POST /api/recipes - Create recipe
- GET /api/recipes/{id} - Get recipe details
- PUT /api/recipes/{id} - Update recipe
- DELETE /api/recipes/{id} - Delete recipe

## Mobile App Development

### Android App Setup

1. Install dependencies:

```bash
npm install
```

2. Build the web assets:

```bash
npm run build
```

3. Sync Capacitor project:

```bash
npm run cap:sync
```

4. Open in Android Studio:

```bash
npm run cap:open:android
```

5. Build APK:

```bash
npm run cap:build:android
```

### Mobile Features

- Native splash screen
- Offline support
- Native navigation
- Secure HTTPS communication
- Modern Android SDK support

## Recent Improvements

1. **Mobile App Migration**
   - Migrated from Cordova to Capacitor
   - Modern native Android implementation
   - Improved performance and native features
   - Better development workflow

1. **API Documentation**
   - Added OpenAPI/Swagger documentation
   - JSDoc comments for better IDE integration
   - Auto-generated TypeScript types

1. **Authentication & Security**
   - Split authentication middleware into separate concerns
   - Added role-based authorization
   - Implemented rate limiting
   - Added security headers

1. **Validation**
   - Request/response validation against OpenAPI schemas
   - File upload validation
   - Error handling improvements

1. **Code Quality**
   - Proper TypeScript types for MongoDB
   - Improved error handling
   - Better separation of concerns

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
