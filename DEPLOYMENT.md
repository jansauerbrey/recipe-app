# Deployment Guide

This document outlines the deployment process and setup requirements for the Recipe App.

## CI/CD Pipeline

Our GitHub Actions pipeline automates the following processes:

### 1. Testing

- Runs all Deno tests using `test.sh`
- Includes leak detection and fail-fast behavior
- Tests must pass before proceeding to other stages

### 2. Security Checks

- Runs `npm audit` to check for dependency vulnerabilities
- Performs Snyk security scanning
- Ensures no known security issues are present

### 3. Android Build

- Builds debug APK using Capacitor
- Runs on every push and pull request
- Artifacts are uploaded for later stages

### 4. Release Management

- Automatic releases created for main branch pushes
- APK attached to GitHub releases
- Version numbering based on GitHub run number

### 5. Staging Deployment

- Deploys to Firebase App Distribution for testing
- Triggered on pushes to develop branch
- Distributed to designated tester groups

## Required Secrets

The following secrets need to be configured in GitHub repository settings:

1. `SNYK_TOKEN`: For security scanning
   - Obtain from [Snyk Dashboard](https://app.snyk.io)
   - Required for security job

2. `FIREBASE_APP_ID`: For staging deployment
   - Get from Firebase Console
   - Required for staging deployment

3. `FIREBASE_TOKEN`: For Firebase authentication
   - Generate using `firebase login:ci`
   - Required for staging deployment

## Environment Setup

### Development

1. Clone repository
2. Install dependencies: `npm install`
3. Run tests: `./test.sh`
4. Start development server: `npm start`

### Staging

- Builds deployed automatically to Firebase App Distribution
- Access through Firebase App Distribution console
- Available to registered testers

### Production

- Released through GitHub Releases
- APK available for download
- Version tagged automatically

## Deployment Flow

1. Development:
   - Work on feature branches
   - Create pull request to develop

2. Staging:
   - Merge to develop branch
   - Automatic deployment to Firebase App Distribution
   - Testing by QA team

3. Production:
   - Merge develop to main
   - Automatic release creation
   - APK published to GitHub Releases

## Manual Deployment

If needed, manual deployment can be performed:

```bash
# Build APK
npm run build
npm run cap:sync
cd android
./gradlew assembleDebug

# APK will be in:
android/app/build/outputs/apk/debug/app-debug.apk
```

## Monitoring

- Check GitHub Actions for build status
- Monitor Firebase Console for staging deployments
- Review GitHub Releases for production versions

## Rollback Procedure

1. For staging:
   - Revert commit in develop branch
   - Pipeline will automatically deploy previous version

2. For production:
   - Revert commit in main branch
   - Download and distribute previous release APK

## Best Practices

1. Version Control:
   - Always create feature branches
   - Use meaningful commit messages
   - Keep branches up to date with develop

2. Testing:
   - Run tests locally before pushing
   - Add tests for new features
   - Maintain test coverage

3. Security:
   - Review security scan results
   - Update dependencies regularly
   - Follow security best practices

4. Deployment:
   - Monitor deployment process
   - Verify staging before production
   - Document any manual interventions

## Troubleshooting

Common issues and solutions:

1. Failed Tests:
   - Check test logs in GitHub Actions
   - Run tests locally to reproduce
   - Review recent changes

2. Build Failures:
   - Verify Android SDK setup
   - Check Capacitor configuration
   - Review build logs

3. Deployment Issues:
   - Verify secrets configuration
   - Check Firebase credentials
   - Review deployment logs

## Support

For deployment issues or questions:

1. Check GitHub Actions logs
2. Review error messages
3. Consult team lead or DevOps
