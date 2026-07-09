import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  getSecureSession,
  getSecureSessionWithBiometric,
  saveSecureSession,
  clearSecureSession,
} from '../helpers/secureStorage';
import { getConfiguredIP, setConfiguredIP } from '../helpers/storageHelpers';
import { logoutUser } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState(null);
  const [userDetails, setUserDetailsState] = useState(null);
  const [configuredIP, setConfiguredIPState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ip = await getConfiguredIP();
        setConfiguredIPState(ip);
      } catch (error) {
        console.error('AuthContext: Error loading IP:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Check token expiry periodically
  useEffect(() => {
    if (!tokenExpiry) return;

    const checkExpiry = setInterval(() => {
      const now = Date.now();
      const timeUntilExpiry = tokenExpiry - now;

      if (timeUntilExpiry <= 0) {
        console.log('AuthContext: Token expired, logging out');
        logout();
      } else if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('AuthContext: Token expiring soon!');
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkExpiry);
  }, [tokenExpiry]);

  const authenticate = async () => {
    try {
      const session = await getSecureSession();

      if (session) {
        console.log('AuthContext: Setting token and user from session');
        setAccessTokenState(session.token);
        setUserDetailsState(session.user);
        setIsAuthenticated(true);

        // If token has expiry info, set it
        if (session.tokenExpiry) {
          setTokenExpiry(session.tokenExpiry);
        }

        return session;
      }
      return null;
    } catch (error) {
      console.error('AuthContext: Authentication failed:', error);
      return null;
    }
  };

  const login = async (token, user, ip) => {
    setAccessTokenState(token);
    setUserDetailsState(user);
    setConfiguredIPState(ip);
    setIsAuthenticated(true);

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));

        if (payload.exp) {
          const expiryMs = payload.exp * 1000;
          setTokenExpiry(expiryMs);
          console.log(
            'AuthContext: Token expires at:',
            new Date(expiryMs).toISOString(),
          );
        }
      }
    } catch (e) {
      console.log('AuthContext: Could not decode token expiry:', e.message);
    }

    // Save to storage
    await saveSecureSession(token, user);
    if (ip) await setConfiguredIP(ip);
  };

  const updateToken = useCallback(newToken => {
    console.log('AuthContext: updateToken() called');
    setAccessTokenState(newToken);
  }, []);

  const updateIP = async ip => {
    console.log('AuthContext: updateIP() called with:', ip);
    setConfiguredIPState(ip);
    await setConfiguredIP(ip);
  };

  const logout = async () => {
    console.log('AuthContext: logout() called');

    // Call logout API before clearing local state
    if (configuredIP && accessToken) {
      try {
        await logoutUser(configuredIP, accessToken);
      } catch (error) {
        console.error('AuthContext: Logout API failed:', error.message);
      }
    } else {
      console.log('AuthContext: Skipping logout API - no IP or token');
    }

    // Clear local state
    setAccessTokenState(null);
    setUserDetailsState(null);
    setConfiguredIPState(null);
    setIsAuthenticated(false);
    setTokenExpiry(null);
    await clearSecureSession();
  };

  const value = {
    accessToken,
    userDetails,
    configuredIP,
    isLoading,
    isAuthenticated,
    tokenExpiry,
    authenticate,
    login,
    updateToken,
    updateIP,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
