import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.andarbem.app',
  appName: 'AndarBem',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Geolocation: {
      permissions: {
        location: "always"
      },
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 3000
    },
    Camera: {
      permissions: {
        camera: "camera",
        photos: "photos"
      }
    },
    Motion: {
      interval: 100
    }
  }
};

export default config;
