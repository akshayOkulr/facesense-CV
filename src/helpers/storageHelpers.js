import {
  getConfiguredIPNoAuth,
  setConfiguredIPNoAuth,
  getAccessToken,
  setAccessToken,
  getUserDetails,
  setUserDetails,
  clearAllStorage,
  saveSecureSession,
  getSecureSession,
  getSecureSessionWithBiometric,
  clearSecureSession,
} from './secureStorage';

export const getConfiguredIP = getConfiguredIPNoAuth;
export const setConfiguredIP = setConfiguredIPNoAuth;

export {
  getAccessToken,
  setAccessToken,
  getUserDetails,
  setUserDetails,
  clearAllStorage,
  saveSecureSession,
  getSecureSession,
  getSecureSessionWithBiometric,
  clearSecureSession,
};
