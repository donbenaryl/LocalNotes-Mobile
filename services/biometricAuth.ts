import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
    fallbackLabel: 'Use passcode',
  });
  return result.success;
}
