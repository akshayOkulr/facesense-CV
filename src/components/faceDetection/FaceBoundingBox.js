/**
 * Face Bounding Box Component
 * Memoized component for rendering face bounding boxes
 */

import React, { memo, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { transformBoundsForRotation } from './transformations';

const FaceBoundingBox = memo(
  ({
    face,
    index,
    faceId,
    rotation,
    screenWidth,
    screenHeight,
    isFrontCamera,
  }) => {
    const aFaceW = useSharedValue(0);
    const aFaceH = useSharedValue(0);
    const aFaceX = useSharedValue(0);
    const aFaceY = useSharedValue(0);
    const aRot = useSharedValue(0);

    useEffect(() => {
      if (face?.bounds && screenWidth && screenHeight) {
        const transformed = transformBoundsForRotation(
          face.bounds,
          rotation || 0,
          screenWidth,
          screenHeight,
          isFrontCamera || false,
        );
        const { width, height, x, y } = transformed;
        aFaceW.value = width;
        aFaceH.value = height;
        aFaceX.value = x;
        aFaceY.value = y;
      }
    }, [face, rotation, screenWidth, screenHeight, isFrontCamera]);

    const boundingBoxStyle = useAnimatedStyle(() => ({
      position: 'absolute',
      borderWidth: 2,
      borderColor: '#16FF2E',
      width: withTiming(aFaceW.value, { duration: 50 }),
      height: withTiming(aFaceH.value, { duration: 50 }),
      left: withTiming(aFaceX.value, { duration: 50 }),
      top: withTiming(aFaceY.value, { duration: 50 }),
      transform: [{ rotate: `${aRot.value}deg` }],
    }));

    return <Animated.View style={boundingBoxStyle} />;
  },
  (prevProps, nextProps) => {
    const prevFace = prevProps.face;
    const nextFace = nextProps.face;

    if (!prevFace && !nextFace) return true;
    if (!prevFace || !nextFace) return false;

    const prevBounds = prevFace.bounds;
    const nextBounds = nextFace.bounds;

    if (!prevBounds && !nextBounds) return true;
    if (!prevBounds || !nextBounds) return false;

    return (
      Math.abs(prevBounds.width - nextBounds.width) <= 2 &&
      Math.abs(prevBounds.height - nextBounds.height) <= 2 &&
      Math.abs(prevBounds.x - nextBounds.x) <= 2 &&
      Math.abs(prevBounds.y - nextBounds.y) <= 2 &&
      prevProps.index === nextProps.index &&
      prevProps.rotation === nextProps.rotation &&
      prevProps.screenWidth === nextProps.screenWidth &&
      prevProps.screenHeight === nextProps.screenHeight &&
      prevProps.isFrontCamera === nextProps.isFrontCamera
    );
  },
);

export default FaceBoundingBox;
