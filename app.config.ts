import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = true;
const PRODUCTION_API_URL = 'https://api.localnotesapp.com';

const apiUrl = IS_DEV
  ? (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000')
  : PRODUCTION_API_URL;

const googleWebClientId = (
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
).trim();
const googleIosClientId = (
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? ''
).trim();
const googleIosUrlScheme = (() => {
  const explicit = (process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? '').trim();
  if (explicit) return explicit;
  const match = googleIosClientId.match(
    /^([\w-]+)\.apps\.googleusercontent\.com$/,
  );
  return match ? `com.googleusercontent.apps.${match[1]}` : '';
})();

const plugins: ExpoConfig['plugins'] = [
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
      photosPermission:
        'LocalNotes needs access to your photo library to update your profile photo.',
      cameraPermission:
        'LocalNotes needs access to your camera to take a profile photo.',
    },
  ],
  [
    'expo-notifications',
    {
      icon: './assets/icon.png',
      color: '#FF6B2C',
      defaultChannel: 'default',
    },
  ],
  'expo-apple-authentication',
  [
    'expo-local-authentication',
    {
      faceIDPermission:
        'LocalNotes uses Face ID to unlock your account on this device.',
    },
  ],
  '@bacons/apple-targets',
];

if (googleIosUrlScheme) {
  plugins.push([
    '@react-native-google-signin/google-signin',
    { iosUrlScheme: googleIosUrlScheme },
  ]);
}

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
    backgroundColor: '#FF6B1A',
  },
  ios: {
    supportsTablet: true,
    userInterfaceStyle: 'automatic',
    bundleIdentifier: IS_DEV
      ? 'com.localnotes.mobile.dev'
      : 'com.localnotes.mobile',
    usesAppleSignIn: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'LocalNotes uses your location to show nearby businesses in Smart Pick.',
      NSPhotoLibraryUsageDescription:
        'LocalNotes needs access to your photo library to update your profile photo.',
      NSCameraUsageDescription:
        'LocalNotes needs access to your camera to take a profile photo.',
      NSFaceIDUsageDescription:
        'LocalNotes uses Face ID to unlock your account on this device.',
      // temporary fix for local development
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
      NSLocalNetworkUsageDescription: 'Connect to local development server',
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
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins,
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl,
    googleWebClientId,
    googleIosClientId,
    googleIosUrlScheme,
    eas: {
      projectId: '4acb42c5-b5a9-43e0-bbb8-57e527cb98be',
    },
  },
});
