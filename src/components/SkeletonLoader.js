import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const SkeletonLoader = ({ width, height, style }) => {
  const opacityValue = useRef(new Animated.Value(0.5)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animationRef.current.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [opacityValue]);

  return (
    <Animated.View
      style={[styles.skeleton, { width, height, opacity: opacityValue }, style]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.userBg,
    borderRadius: 4,
  },
});

export default SkeletonLoader;
