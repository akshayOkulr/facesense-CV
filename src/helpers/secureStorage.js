import * as Keychain from 'react-native-keychain';

const IP_SERVICE = 'FACE_SENSE_IP';
const SESSION_SERVICE = 'FACE_SENSE_SESSION';

export { SESSION_SERVICE };

export const setConfiguredIPNoAuth = async ip => {
  try {
    await Keychain.setGenericPassword('IP', ip, { service: IP_SERVICE });
  } catch (e) {
    console.error('setConfiguredIPNoAuth error:', e);
  }
};

// All API calls now go through a single fixed API Gateway host (see
// src/api/axiosConfig.js) instead of a per-device local IP, so this value
// is only kept to satisfy the existing "configure IP" UI gate.
const CLOUD_GATEWAY_PLACEHOLDER = 'cloud-gateway';

export const getConfiguredIPNoAuth = async () => {
  try {
    const creds = await Keychain.getGenericPassword({
      service: IP_SERVICE,
    });
    return creds ? creds.password : CLOUD_GATEWAY_PLACEHOLDER;
  } catch (e) {
    console.error('getConfiguredIPNoAuth error:', e);
    return CLOUD_GATEWAY_PLACEHOLDER;
  }
};

export const saveSecureSession = async (token, user) => {
  try {
    await Keychain.setGenericPassword(
      'SESSION',
      JSON.stringify({ token, user }),
      {
        service: SESSION_SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      },
    );

    console.log('Session saved successfully to keychain');
  } catch (e) {
    console.error('saveSecureSession error:', e);
    throw e;
  }
};

export const getSecureSession = async () => {
  try {
    console.log('=== secureStorage: getSecureSession ===');
    const creds = await Keychain.getGenericPassword({
      service: SESSION_SERVICE,
    });

    if (creds) {
      const session = JSON.parse(creds.password);
      console.log('Session retrieved successfully');
      console.log('Token present:', !!session.token);
      console.log(
        'Token (first 50 chars):',
        session.token ? session.token.substring(0, 50) + '...' : 'null',
      );
      console.log('User present:', !!session.user);
      return session;
    }

    console.log('No session found in keychain');
    return null;
  } catch (e) {
    console.error('getSecureSession error:', e);
    return null;
  }
};

export const getSecureSessionWithBiometric = async () => {
  try {
    console.log(
      'getSecureSessionWithBiometric: Attempting to retrieve session with authentication',
    );

    const creds = await Keychain.getGenericPassword({
      service: SESSION_SERVICE,
      authenticationPrompt: {
        title: 'Authenticate to continue',
        subtitle: 'Use fingerprint or device credentials',
        description: 'Verify your identity to access the app',
        cancel: 'Cancel',
      },
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
    });

    console.log('getSecureSessionWithBiometric: Session retrieved?', !!creds);
    return creds ? JSON.parse(creds.password) : null;
  } catch (e) {
    console.error('getSecureSessionWithBiometric error:', e);
    // Re-throw the error so the caller knows authentication failed
    throw e;
  }
};

export const clearSecureSession = async () => {
  try {
    await Keychain.resetGenericPassword({
      service: SESSION_SERVICE,
    });
  } catch (e) {
    console.error('clearSecureSession error:', e);
  }
};
