import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const PRODUCTION_API_URL = 'https://api.localnotesapp.com';

const apiUrl = IS_DEV
  ? (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000')
  : PRODUCTION_API_URL;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'LocalNotes (Dev)' : 'LocalNotes',
  slug: IS_DEV ? 'LocalNotesMobile-dev' : 'LocalNotesMobile',
  owner: 'akaxcile99',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  scheme: 'localnotes',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    userInterfaceStyle: 'automatic',
    bundleIdentifier: IS_DEV ? 'com.localnotes.mobile.dev' : 'com.localnotes.mobile',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'LocalNotes uses your location to show nearby businesses in Smart Pick.',
      NSPhotoLibraryUsageDescription:
        'LocalNotes needs access to your photo library to update your profile photo.',
      NSCameraUsageDescription:
        'LocalNotes needs access to your camera to take a profile photo.',
    },
  },
  android: {
    userInterfaceStyle: 'automatic',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: IS_DEV ? 'com.localnotes.mobile.dev' : 'com.localnotes.mobile',
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_EXTERNAL_STORAGE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow LocalNotes to use your location for nearby Smart Pick recommendations.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'LocalNotes needs access to your photo library to update your profile photo.',
        cameraPermission: 'LocalNotes needs access to your camera to take a profile photo.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl,
    eas: {
      projectId: '4acb42c5-b5a9-43e0-bbb8-57e527cb98be',
    },
  },
});
