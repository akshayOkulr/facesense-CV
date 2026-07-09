/**
 * Face Detection Utility Functions
 * Common helper functions for face detection and processing
 */

import PhotoManipulator from 'react-native-photo-manipulator';

/**
 * Comprehensive face object validation
 * Validates all required properties and handles edge cases
 */
export const validateFaceObject = (face, faceIndex) => {
  if (!face || typeof face !== 'object') {
    // console.error(
    //   `validateFaceObject: Face ${faceIndex} is not a valid object`,
    //   face,
    // );
    return null;
  }

  // Validate bounds
  const bounds = face.bounds;
  if (!bounds || typeof bounds !== 'object') {
    // console.error(
    //   `validateFaceObject: Face ${faceIndex} has invalid bounds`,
    //   bounds,
    // );
    return null;
  }

  // Validate bounds properties with type checking
  const validatedBounds = {
    x: typeof bounds.x === 'number' && !isNaN(bounds.x) ? bounds.x : 0,
    y: typeof bounds.y === 'number' && !isNaN(bounds.y) ? bounds.y : 0,
    width:
      typeof bounds.width === 'number' && !isNaN(bounds.width)
        ? bounds.width
        : 0,
    height:
      typeof bounds.height === 'number' && !isNaN(bounds.height)
        ? bounds.height
        : 0,
  };

  // Validate dimensions are reasonable
  if (validatedBounds.width <= 0 || validatedBounds.height <= 0) {
    // console.error(
    //   `validateFaceObject: Face ${faceIndex} has invalid dimensions`,
    //   validatedBounds,
    // );
    return null;
  }

  // Validate probabilities with safe defaults
  const validatedFace = {
    ...face,
    bounds: validatedBounds,
    smilingProbability:
      typeof face.smilingProbability === 'number' ? face.smilingProbability : 0,
    leftEyeOpenProbability:
      typeof face.leftEyeOpenProbability === 'number'
        ? face.leftEyeOpenProbability
        : 0,
    rightEyeOpenProbability:
      typeof face.rightEyeOpenProbability === 'number'
        ? face.rightEyeOpenProbability
        : 0,
    landmarks: face.landmarks || {},
    contours: face.contours || {},
    faceId: face.faceId || faceIndex,
    isValid: true,
  };

  // console.log(
  //   `validateFaceObject: Face ${faceIndex} validated successfully`,
  //   validatedFace,
  // );
  return validatedFace;
};

/**
 * Enhanced crop function with comprehensive error handling
 */
export const cropFaceImage = async (photoPath, cropRegion, faceIndex) => {
  if (!photoPath || !cropRegion) {
    throw new Error(`Invalid crop parameters for face ${faceIndex}`);
  }

  console.log(
    `cropFaceImage: Starting crop for face ${faceIndex} with region:`,
    cropRegion,
  );

  // Validate crop region
  if (
    typeof cropRegion.x !== 'number' ||
    typeof cropRegion.y !== 'number' ||
    typeof cropRegion.width !== 'number' ||
    typeof cropRegion.height !== 'number'
  ) {
    throw new Error(`Invalid crop region coordinates for face ${faceIndex}`);
  }

  if (cropRegion.width <= 0 || cropRegion.height <= 0) {
    throw new Error(`Invalid crop region dimensions for face ${faceIndex}`);
  }

  try {
    const result = await PhotoManipulator.crop(
      `file://${photoPath}`,
      cropRegion,
    );

    if (!result) {
      throw new Error(`Crop operation returned null for face ${faceIndex}`);
    }

    const finalUri = `file://${result}`;
    console.log(`cropFaceImage: Successfully cropped face ${faceIndex}`);
    return finalUri;
  } catch (error) {
    console.error(`cropFaceImage: Failed to crop face ${faceIndex}`);
    throw new Error('Face cropping failed');
  }
};

/**
 * Handle camera mount errors with user feedback
 */
export const handleCameraMountError = error => {
  console.error('camera mount error', error);
};
