import * as Keychain from 'react-native-keychain';

export const isBiometricAvailable = async () => {
  try {
    const biometryType = await Keychain.getSupportedBiometryType();
    console.log('isBiometricAvailable: Biometry type:', biometryType);
    return {
      available: !!biometryType,
      type: biometryType,
    };
  } catch (e) {
    console.log('isBiometricAvailable: Error checking biometry:', e);
    return {
      available: false,
      type: null,
    };
  }
};
