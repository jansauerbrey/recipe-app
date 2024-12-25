# Recipe App

![CI/CD Pipeline](https://github.com/[username]/recipe-app/workflows/CI%2FCD%20Pipeline/badge.svg)
![Version](https://img.shields.io/github/package-json/v/[username]/recipe-app)

A mobile recipe management application built with Capacitor.

## Features

- Recipe management
- Shopping lists
- Meal planning
- Categories and tags
- User authentication
- Offline support

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Deno
- Android Studio (for Android development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/[username]/recipe-app.git
cd recipe-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development Workflow

1. Create a feature branch:

```bash
git checkout -b feature/your-feature
```

2. Make your changes and test:

```bash
# Run tests
npm test

# Check code quality
npm run lint

# Fix linting issues
npm run lint:fix
```

3. Commit your changes:

```bash
git add .
git commit -m "describe your changes"
git push origin feature/your-feature
```

4. Create a Pull Request to the main branch

### Building the App

Build debug APK:

```bash
# Sync Capacitor
npm run cap:sync

# Build Android app
npm run cap:build:android
```

The APK will be available at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Deployment

The deployment process is simple and automated:

1. When code is merged to main branch, the CI pipeline:
   - Runs all tests
   - Checks code quality
   - Performs security scan
   - Builds the APK
   - Creates a new GitHub Release
   - Uploads the APK to the release

2. To get the latest version:
   - Go to the GitHub repository
   - Click on "Releases"
   - Download the latest app-debug.apk

3. To install on Android:
   - Transfer the APK to your Android device
   - Open the APK file on your device
   - Follow the installation prompts

## Version Management

The app uses semantic versioning:

```bash
# For bug fixes
npm run version:patch

# For new features
npm run version:minor

# For breaking changes
npm run version:major
```

## Support

For support and questions:

1. Check existing issues or create a new one
2. Review the documentation
3. Contact the development team

## Security

To report security vulnerabilities, please use the GitHub Security Advisory feature.
