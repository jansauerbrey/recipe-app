import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rezeptplaner.app',
  appName: 'Recipe Planner',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    hostname: 'rezept-planer.de',
    allowNavigation: ['*.rezept-planer.de'],
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'recipe-planner',
    },
    minWebViewVersion: 22,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#999999',
    },
  },
};

export default config;
