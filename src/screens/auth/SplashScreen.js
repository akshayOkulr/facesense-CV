import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { AppLogo } from '../../assets';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSecureSessionWithBiometric,
  getConfiguredIPNoAuth,
  SESSION_SERVICE,
} from '../../helpers/secureStorage';
import * as Keychain from 'react-native-keychain';

const ROLE_ROUTES = {
  ADMIN: 'AdminNavigator',
  TEACHER: 'TeachersNavigator',
};

const SplashScreen = ({ navigation }) => {
  const { login } = useAuth();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const authenticateAndNavigate = async () => {
      try {
        const hasSession = await Keychain.hasGenericPassword({
          service: SESSION_SERVICE,
        });

        if (!hasSession) {
          navigation.replace('LoginScreen');
          return;
        }

        const session = await getSecureSessionWithBiometric();

        if (!session) {
          navigation.replace('LoginScreen');
          return;
        }

        const configuredIP = await getConfiguredIPNoAuth();
        console.log('SplashScreen: Configured IP:', configuredIP);

        await login(session.token, session.user, configuredIP);
        navigateByRole(session.user?.role);
      } catch (error) {
        console.error('SplashScreen: Authentication error:', error);
        // If biometric authentication is cancelled or fails, go to login
        navigation.replace('LoginScreen');
      }
    };

    authenticateAndNavigate();
  }, [navigation, login]);

  const navigateByRole = role => {
    const route = ROLE_ROUTES[role?.toUpperCase()];
    navigation.replace(route || 'LoginScreen');
  };

  return (
    <View style={styles.container}>
      <AppLogo width={200} height={200} />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
