import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { LoginLogo, Okulr, OkulrLogo } from '../../assets';
import Toast from 'react-native-toast-message';
import AppInput from '../../components/AppInput';
import colors from '../../theme/colors';
import { loginUser } from '../../api/authApi';
import AppText from '../../components/AppText';
import ForgotPasswordModal from '../../components/ForgotPassword';
import { useAuth } from '../../contexts/AuthContext';
import { saveSecureSession } from '../../helpers/secureStorage';
import { isBiometricAvailable } from '../../helpers/KeyChain';

const { height: screenHeight } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { configuredIP, login, updateIP } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isFrgPwdVisible, setIsFrgPwdVisible] = useState(false);
  const [ipAddress, setIpAddress] = useState('');

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Keyboard animations
  const logoContainerHeight = useRef(
    new Animated.Value(screenHeight * 0.3),
  ).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  // Initial load animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const logoInitialScale = useRef(new Animated.Value(0.5)).current;
  const logoInitialOpacity = useRef(new Animated.Value(0)).current;
  const loginBoxTranslateY = useRef(new Animated.Value(300)).current;
  const loginBoxOpacity = useRef(new Animated.Value(0)).current;
  const inputFieldsOpacity = useRef(new Animated.Value(0)).current;
  const inputFieldsTranslateY = useRef(new Animated.Value(20)).current;

  const ipLatestRef = useRef('');

  useEffect(() => {
    console.log('Safe area insets:', insets);
  }, [insets]);

  // Initial load animation
  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // 1. Fade in header
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 2. Scale and fade in logo
      Animated.parallel([
        Animated.spring(logoInitialScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoInitialOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 3. Slide up login box (with text visible)
      Animated.parallel([
        Animated.spring(loginBoxTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(loginBoxOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 4. Fade in input fields only
      Animated.parallel([
        Animated.timing(inputFieldsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(inputFieldsTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [
    headerOpacity,
    logoInitialScale,
    logoInitialOpacity,
    loginBoxTranslateY,
    loginBoxOpacity,
    inputFieldsOpacity,
    inputFieldsTranslateY,
  ]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (configuredIP) {
      setIpAddress(configuredIP);
      ipLatestRef.current = configuredIP;
    }
  }, [configuredIP]);

  const handleKeyboardShow = () => {
    Animated.parallel([
      Animated.timing(logoContainerHeight, {
        toValue: 80,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 0.4,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleKeyboardHide = () => {
    Animated.parallel([
      Animated.spring(logoContainerHeight, {
        toValue: screenHeight * 0.3,
        tension: 50,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const identifier = email?.trim();
    const pwd = password?.trim();

    if (!identifier || !pwd) {
      Toast.show({
        type: 'AppError',
        text1: 'Please enter both email/username and password',
        position: 'bottom',
      });
      return;
    }

    if (identifier.includes('@') && !emailRegex.test(identifier)) {
      Toast.show({
        type: 'AppError',
        text1: 'Please enter a valid email address',
        position: 'bottom',
      });
      return;
    }

    if (pwd.length < 6) {
      Toast.show({
        type: 'AppError',
        text1: 'Password must be at least 6 characters',
        position: 'bottom',
      });
      return;
    }

    try {
      setIsLoggingIn(true);

      const data = await loginUser(ipLatestRef.current, identifier, pwd);
      const token = data?.accessToken;

      const userRole = data?.user?.role?.toUpperCase();
      if (userRole === 'ADMIN') {
        console.log('LoginScreen: Navigating to AdminNavigator');
        const biometricData = await isBiometricAvailable();
        await login(token, data?.user || {}, ipLatestRef.current);
        try {
          await saveSecureSession(token, data?.user);
        } catch (e) {
          console.log('LoginScreen: Failed to save session:', e);
          throw e;
        }
        navigation.replace('AdminNavigator');
      } else if (userRole === 'TEACHER') {
        if (data?.firstTimeSetup) {
          console.log(
            'LoginScreen: First time login, navigating to CreatePasswordScreen',
          );
          navigation.replace('CreatePasswordScreen', {
            username: identifier,
            token: token,
          });
        } else {
          console.log('LoginScreen: Navigating to TeachersNavigator');
          const biometricData = await isBiometricAvailable();
          await login(token, data?.user || {}, ipLatestRef.current);
          try {
            await saveSecureSession(token, data?.user);
          } catch (e) {
            console.log('LoginScreen: Failed to save session:', e);
            throw e;
          }
          navigation.replace('TeachersNavigator');
        }
      } else {
        console.log(
          'LoginScreen: Unknown role:',
          data?.user?.role,
          'staying on LoginScreen',
        );
      }
    } catch (err) {
      Toast.show({
        type: 'AppError',
        text1: err.message || 'Login failed',
        position: 'bottom',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = () => {
    setIsFrgPwdVisible(true);
  };

  return (
    <>
      <SafeAreaView style={styles.topSafeArea} edges={['top']} />
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.mainContainer}>
              {/* Animated Header */}
              <Animated.View
                style={[styles.headerContainer, { opacity: headerOpacity }]}
              >
                <OkulrLogo />
              </Animated.View>

              {/* Animated Logo Container */}
              <Animated.View
                style={[styles.logoContainer, { height: logoContainerHeight }]}
              >
                <Animated.View
                  style={{
                    opacity: Animated.multiply(logoOpacity, logoInitialOpacity),
                    transform: [
                      { scale: Animated.multiply(logoScale, logoInitialScale) },
                    ],
                  }}
                >
                  <LoginLogo />
                </Animated.View>
              </Animated.View>

              {/* Animated Login Box */}
              <Animated.View
                style={[
                  styles.loginBox,
                  {
                    opacity: loginBoxOpacity,
                    transform: [{ translateY: loginBoxTranslateY }],
                  },
                ]}
              >
                <View style={styles.loginContent}>
                  {/* Form Container */}
                  <View style={styles.formContainer}>
                    {/* Text visible immediately with login box */}
                    <AppText
                      style={styles.welcomeText}
                      text={'Welcome! Login Here'}
                    />
                    <AppText
                      style={styles.subText}
                      text={'Your attendance system made easy...'}
                    />

                    {/* Animated Input Fields */}
                    <Animated.View
                      style={{
                        opacity: inputFieldsOpacity,
                        transform: [{ translateY: inputFieldsTranslateY }],
                      }}
                    >
                      <AppInput
                        label="Email or Username"
                        placeholder="Email or Username"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        testID="email-input"
                        marginBottom={30}
                      />

                      <AppInput
                        label="Password"
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        accessibilityLabel="Password input field"
                        accessibilityHint="Enter your password securely. Minimum 6 characters required."
                        testID="password-input"
                      />

                      <TouchableOpacity
                        style={styles.forgotPasswordContainer}
                        onPress={handleForgotPassword}
                      >
                        <Text style={styles.forgotPassword}>
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.loginButton}
                        onPress={isLoggingIn ? undefined : handleLogin}
                        activeOpacity={0.8}
                      >
                        {isLoggingIn ? (
                          <ActivityIndicator color={colors.primary} />
                        ) : (
                          <AppText
                            text={'LOGIN'}
                            style={styles.loginButtonText}
                          />
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  {/* Footer visible with login box */}
                  <View style={styles.footerContainer}>
                    <View style={styles.footerRow}>
                      <Text style={styles.footerText}>Product of </Text>
                      <Okulr />
                    </View>
                  </View>
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>

          <ForgotPasswordModal
            visible={isFrgPwdVisible}
            onClose={() => setIsFrgPwdVisible(false)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  topSafeArea: {
    flex: 0,
    backgroundColor: colors.background,
  },
  bottomSafeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: { flex: 1 },
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 80,
  },
  loginBox: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: 30,
    paddingHorizontal: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  loginContent: { flex: 1, justifyContent: 'space-between' },
  formContainer: { flex: 1, justifyContent: 'flex-start' },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    fontSize: 14,
  },
  forgotPasswordContainer: {
    padding: 10,
    alignSelf: 'flex-end',
    marginTop: -12,
    marginBottom: 25,
  },
  forgotPassword: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  loginButton: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    width: 140,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
});
