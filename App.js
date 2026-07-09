import React, { useEffect } from 'react';
import { Text, TextInput, BackHandler, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Router from './src/router';
import { toastConfig } from './src/helpers/CustomToast/toastConfig';
import Toast from 'react-native-toast-message';
import JailMonkey from 'jail-monkey';
import { AuthProvider } from './src/contexts/AuthContext';

const GLOBAL_FONT = 'Inter_28pt-Regular';

if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.style = { fontFamily: GLOBAL_FONT };

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.style = { fontFamily: GLOBAL_FONT };

const SecurityCheck = () => {
  useEffect(() => {
    const isJailBroken = JailMonkey.isJailBroken();
    if (isJailBroken) {
      Alert.alert(
        'Security Alert',
        'This app cannot run on jailbroken or rooted devices for security reasons.',
        [
          {
            text: 'OK',
            onPress: () => {
              BackHandler.exitApp();
            },
          },
        ],
        { cancelable: false },
      );
      return;
    }
  }, []);
  return null;
};

export default function App() {
  return (
    <>
      <SecurityCheck />

      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <Router />
            <Toast config={toastConfig} />
          </NavigationContainer>
        </GestureHandlerRootView>
      </AuthProvider>
    </>
  );
}
