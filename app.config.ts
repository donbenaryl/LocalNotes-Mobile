import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = true;
const PRODUCTION_API_URL = 'https://api.localnotesapp.com';
const PRODUCTION_WEB_APP_URL = 'https://app.localnotesapp.com';

const apiUrl = IS_DEV
  ? (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000')
  : PRODUCTION_API_URL;

// Web app URL used to hand off paid features (e.g. publishing an Offer) to
// the browser — payment processing must never happen inside the mobile app.
const webAppUrl = (
  process.env.EXPO_PUBLIC_WEB_APP_URL ?? PRODUCTION_WEB_APP_URL
).trim();

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

const LOCATION_WHEN_IN_USE =
  'LocalNotes uses your location while you use the app to show nearby recommendations. For example, Home can list cafes and shops near you, and Search can find lists around your current area.';

const PHOTO_LIBRARY_USAGE =
  'LocalNotes needs access to your photo library so you can choose a profile photo from Edit Profile.';

const CAMERA_USAGE =
  'LocalNotes needs access to your camera so you can take a new profile photo from Edit Profile.';

const FACE_ID_USAGE =
  'LocalNotes uses Face ID to unlock your account on this device.';

const CONTACTS_USAGE =
  'LocalNotes uses your contacts to show which of your friends are already on LocalNotes. Phone numbers are hashed before they leave your device and are never stored.';

const plugins: ExpoConfig['plugins'] = [
  './plugins/withOptionalPortraitFeature',
  [
    'expo-build-properties',
    {
      android: {
        enableMinifyInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true,
      },
    },
  ],
  'expo-router',
  'expo-secure-store',
  [
    'expo-location',
    {
      locationWhenInUsePermission: LOCATION_WHEN_IN_USE,
      // Do not request Always permission; omit Always strings so Expo does not
      // inject generic "Allow $(PRODUCT_NAME) to access your location" copy.
      isIosBackgroundLocationEnabled: false,
      isAndroidBackgroundLocationEnabled: false,
    },
  ],
  [
    'expo-image-picker',
    {
      photosPermission: PHOTO_LIBRARY_USAGE,
      cameraPermission: CAMERA_USAGE,
      // Microphone is unused; avoid a generic NSMicrophoneUsageDescription.
      microphonePermission: false,
    },
  ],
  [
    'expo-notifications',
    {
      icon: './assets/icon.png',
      color: '#141413',
      defaultChannel: 'default',
    },
  ],
  'expo-apple-authentication',
  [
    'expo-local-authentication',
    {
      faceIDPermission: FACE_ID_USAGE,
    },
  ],
  [
    'expo-contacts',
    {
      contactsPermission: CONTACTS_USAGE,
    },
  ],
  'expo-video',
  '@bacons/apple-targets',
];

if (googleIosUrlScheme) {
  plugins.push([
    '@react-native-google-signin/google-signin',
    { iosUrlScheme: googleIosUrlScheme },
  ]);
}

const iosInfoPlist: NonNullable<ExpoConfig['ios']>['infoPlist'] = {
  NSLocationWhenInUseUsageDescription: LOCATION_WHEN_IN_USE,
  NSPhotoLibraryUsageDescription: PHOTO_LIBRARY_USAGE,
  NSCameraUsageDescription: CAMERA_USAGE,
  NSFaceIDUsageDescription: FACE_ID_USAGE,
  NSContactsUsageDescription: CONTACTS_USAGE,
};

if (IS_DEV) {
  iosInfoPlist.NSAppTransportSecurity = {
    NSAllowsArbitraryLoads: true,
  };
  iosInfoPlist.NSLocalNetworkUsageDescription =
    'Connect to local development server';
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'LocalNotes (Dev)' : 'LocalNotes',
  slug: IS_DEV ? 'LocalNotesMobile-dev' : 'LocalNotesMobile',
  owner: 'akaxcile99',
  version: '1.0.8',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  scheme: 'localnotes',
  splash: {
    image: './assets/images/logo/ln-icon-light.png',
    resizeMode: 'contain',
    backgroundColor: '#F7F3EC',
    dark: {
      image: './assets/images/logo/ln-icon-dark.png',
      backgroundColor: '#161412',
    },
  },
  ios: {
    supportsTablet: true,
    userInterfaceStyle: 'automatic',
    bundleIdentifier: IS_DEV
      ? 'com.localnotes.mobile.dev'
      : 'com.localnotes.mobile',
    usesAppleSignIn: true,
    infoPlist: iosInfoPlist,
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
    config: {
      googleMaps: {
        apiKey: (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim(),
      },
    },
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.READ_CONTACTS',
    ],
    // expo-contacts' plugin adds WRITE_CONTACTS; we only read.
    // READ_MEDIA_* blocked so Play uses the system photo picker policy path.
    blockedPermissions: [
      'android.permission.WRITE_CONTACTS',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
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
    webAppUrl,
    googleWebClientId,
    googleIosClientId,
    googleIosUrlScheme,
    eas: {
      projectId: '4acb42c5-b5a9-43e0-bbb8-57e527cb98be',
    },
  },
});
