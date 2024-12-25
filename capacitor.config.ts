import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.sby.recipeapp',
  appName: 'Rezept Planer',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    hostname: 'rezept-planer.de',
    allowNavigation: ['*.rezept-planer.de'],
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: 'app/release.keystore',
      keystoreAlias: 'recipe-planner',
      keystorePassword: 'recipeapp',
      keystoreAliasPassword: 'recipeapp',
      releaseType: 'APK'
    },
    minWebViewVersion: 17,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#999999',
    },
  },
};

export default config;
