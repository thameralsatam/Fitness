import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitness.trainingapp',
  appName: 'Trainingsplan Full Body',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    }
  }
};

export default config;
