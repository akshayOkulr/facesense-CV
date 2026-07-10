import React, { useState, useEffect, useRef } from 'react';
import { useRoute } from '@react-navigation/native';
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
import { createPasswordApi } from '../../api/authApi';
import AppText from '../../components/AppText';
import ForgotPasswordModal from '../../components/ForgotPassword';

const { height: screenHeight } = Dimensions.get('window');

const CreatePasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { username } = route.params || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isFrgPwdVisible, setIsFrgPwdVisible] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const logoContainerHeight = useRef(
    new Animated.Value(screenHeight * 0.3),
  ).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {}, [insets]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const handleCreatePassword = async () => {
    const pwd = password?.trim();
    const confPwd = confirmPassword?.trim();

    if (!pwd || !confPwd) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Please enter both passwords',
      });
      return;
    }
    if (pwd.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }
    if (pwd !== confPwd) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Passwords do not match',
      });
      return;
    }
    if (!username) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Username not found',
      });
      return;
    }

    try {
      setIsLoggingIn(true);
      const { token } = route.params || {};
      const data = await createPasswordApi(
        'cloud-gateway',
        username,
        pwd,
        token,
      );
      console.log('check Create Password', data);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2:
          'Password created successfully. Please login with your new password.',
      });

      navigation.replace('LoginScreen');
    } catch (err) {
      console.log(err);

      Toast.show({
        type: 'error',
        text1: 'Create Password Error',
        text2: err.message,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = () => {
    setIsFrgPwdVisible(true);
    setTimeout(() => {
      setIsFrgPwdVisible(false);
    }, 3000);
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
              <View style={styles.headerContainer}>
                <OkulrLogo />
              </View>

              <Animated.View
                style={[styles.logoContainer, { height: logoContainerHeight }]}
              >
                <Animated.View
                  style={{
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                  }}
                >
                  <LoginLogo />
                </Animated.View>
              </Animated.View>

              <Animated.View style={styles.loginBox}>
                <View style={styles.loginContent}>
                  <View style={styles.formContainer}>
                    <AppText
                      style={styles.welcomeText}
                      text={'Secure Your Account'}
                    />
                    <Text style={styles.subText}>
                      Please update your password for security practice
                    </Text>

                    <AppInput
                      label="New Password"
                      placeholder="New Password"
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

                    <View style={{ marginBottom: 30 }} />

                    <AppInput
                      label="Confirm Password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      accessibilityLabel="Confirm password input field"
                      accessibilityHint="Re-enter your password to confirm. Must match the new password."
                      testID="confirm-password-input"
                    />

                    <TouchableOpacity
                      style={styles.forgotPasswordContainer}
                      onPress={handleForgotPassword}
                    >
                      <Text style={styles.forgotPassword}></Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={isLoggingIn ? undefined : handleCreatePassword}
                      activeOpacity={0.8}
                    >
                      {isLoggingIn ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <AppText
                          text={'SUBMIT'}
                          style={styles.loginButtonText}
                        />
                      )}
                    </TouchableOpacity>
                  </View>

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
        </KeyboardAvoidingView>

        <ForgotPasswordModal
          visible={isFrgPwdVisible}
          onClose={() => setIsFrgPwdVisible(false)}
        />
        <Toast />
      </SafeAreaView>
    </>
  );
};

export default CreatePasswordScreen;

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
  formContainer: { flex: 1, justifyContent: 'flex-start', paddingTop: 10 },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    fontSize: 14,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
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
