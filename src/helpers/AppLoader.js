import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import colors from '../theme/colors';

const AppLoader = ({
  isLoading = false,
  text = 'Loading...',
  color = colors.primary,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isLoading) {
      animationRef.current?.stop();
      animationRef.current = null;
      return;
    }

    spinValue.setValue(0);

    animationRef.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );

    animationRef.current.start();

    return () => {
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [isLoading, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isLoading) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* <Animated.View
            style={[styles.logoContainer, { transform: [{ rotate: spin }] }]}
          >
            <AppLogo width={60} height={60} style={{ tintColor: color }} />
          </Animated.View> */}
          <FastImage
            source={require('../assets/loader.gif')}
            style={{ width: 120, height: 120 }}
            resizeMode={FastImage.resizeMode.contain}
          />

          {text ? <Text style={styles.text}>{text}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  logoContainer: {
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    marginTop: 15,
  },
});

export default AppLoader;
