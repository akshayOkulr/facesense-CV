import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ToastError, ToastSucess } from '../../assets';

const ToastContainer = ({
  text1,
  status,
  bgColor,
  progressColor,
  visibilityTime = 3000,
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: visibilityTime,
      useNativeDriver: false,
    }).start();
  }, [text1]);

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: visibilityTime,
      useNativeDriver: false,
    }).start();
  }, [Date.now()]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          {status === 'Success' ? <ToastSucess /> : <ToastError />}
        </View>
        <Text style={[styles.text, { color: progressColor }]}>{text1}</Text>
      </View>

      <Animated.View
        style={[
          styles.progressBar,
          {
            width: widthInterpolate,
            backgroundColor: progressColor,
          },
        ]}
      />
    </View>
  );
};

export default ToastContainer;

const styles = StyleSheet.create({
  container: {
    borderRadius: 40,
    marginBottom: 20,
    alignSelf: 'center',
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
  },
  progressBar: {
    height: 2,
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});
