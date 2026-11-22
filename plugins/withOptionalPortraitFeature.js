const { withAndroidManifest } = require('expo/config-plugins');

const PORTRAIT_FEATURE = 'android.hardware.screen.portrait';

/**
 * Marks android.hardware.screen.portrait as optional so Google Play does not
 * filter devices that do not advertise portrait (e.g. some tablets / XR).
 * Portrait lock via orientation: 'portrait' remains unchanged.
 *
 * @type {import('expo/config-plugins').ConfigPlugin}
 */
function withOptionalPortraitFeature(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const features = manifest['uses-feature'] ?? [];
    const list = Array.isArray(features) ? features : [features];

    const existing = list.find(
      (feature) => feature?.$?.['android:name'] === PORTRAIT_FEATURE,
    );

    if (existing) {
      existing.$['android:required'] = 'false';
    } else {
      list.push({
        $: {
          'android:name': PORTRAIT_FEATURE,
          'android:required': 'false',
        },
      });
    }

    manifest['uses-feature'] = list;
    return mod;
  });
}

module.exports = withOptionalPortraitFeature;
