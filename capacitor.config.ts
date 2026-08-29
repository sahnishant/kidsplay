import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kidsplay.app',
  appName: 'Kidsplay',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
