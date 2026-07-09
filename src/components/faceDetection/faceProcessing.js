/**
 * Face Processing Functions
 * Core face detection and cropping logic
 */

import { Alert, Platform } from 'react-native';
import { validateFaceObject, cropFaceImage } from './utils';
import { transformBoundsForRotation } from './transformations';

/**
 * Enhanced function to capture and crop faces with comprehensive orientation handling
 */
export const createCaptureAndCropFaces = (
  camera,
  width,
  height,
  currentRotation,
  setIsProcessing,
  setCapturedImage,
  setCroppedFaces,
  setShowPreview,
  isProcessing,
) => {
  return async faces => {
    if (!camera.current || !faces || faces.length === 0) {
      console.warn('captureAndCropFaces: No camera or faces available');
      return;
    }

    try {
      setIsProcessing(true);
      console.log(
        `Starting face capture and cropping for ${faces.length} faces`,
      );

      // Capture the photo with orientation metadata
      const photo = await camera.current.takePhoto({
        quality: 0.9,
        enableAutoRedEyeReduction: true,
        enableAutoDistortionCorrection: true,
        enableAutoStabilization: true,
      });

      console.log('Photo captured successfully');
      if (!photo || !photo.path) {
        throw new Error('Invalid photo captured: missing path');
      }

      setCapturedImage(photo);

      // Get actual image dimensions with validation
      const actualImageWidth =
        typeof photo.width === 'number' ? photo.width : width;
      const actualImageHeight =
        typeof photo.height === 'number' ? photo.height : height;

      if (actualImageWidth <= 0 || actualImageHeight <= 0) {
        throw new Error(
          `Invalid image dimensions: ${actualImageWidth}x${actualImageHeight}`,
        );
      }

      console.log(
        'Image dimensions:',
        actualImageWidth,
        'x',
        actualImageHeight,
        'Orientation:',
        photo.orientation || 'unknown',
        'Current rotation:',
        currentRotation,
      );

      // Calculate scaling factors with orientation awareness
      let scaleX = actualImageWidth / width;
      let scaleY = actualImageHeight / height;

      // Adjust scaling for different orientations
      if (currentRotation === 90 || currentRotation === 270) {
        // Swap scaling factors for landscape orientations
        scaleX = actualImageWidth / height;
        scaleY = actualImageHeight / width;
      }

      console.log('Orientation-aware scaling factors:', scaleX, scaleY);

      // Crop each face with comprehensive error handling
      const croppedFacesData = [];
      let successfulFaces = 0;

      for (let i = 0; i < faces.length; i++) {
        const face = faces[i];

        if (!face) {
          console.error(`Face ${i + 1}: Face object is null or undefined`);
          continue;
        }

        console.log(`Processing face ${i + 1}:`, face);

        // Validate and extract face bounds with orientation transformation
        let bounds = face.bounds;
        if (!bounds) {
          console.error(`Face ${i + 1}: Missing bounds property`);
          continue;
        }

        // Transform bounds based on current rotation for accurate cropping
        const transformedBounds = transformBoundsForRotation(
          bounds,
          currentRotation,
          width,
          height,
        );

        // Validate transformed bounds
        if (
          !transformedBounds ||
          typeof transformedBounds.x !== 'number' ||
          typeof transformedBounds.y !== 'number' ||
          typeof transformedBounds.width !== 'number' ||
          typeof transformedBounds.height !== 'number'
        ) {
          console.error(
            `Face ${i + 1}: Invalid transformed bounds:`,
            transformedBounds,
          );
          continue;
        }

        // Use transformed bounds for cropping
        const {
          x,
          y,
          width: faceWidth,
          height: faceHeight,
        } = transformedBounds;

        console.log(`Face ${i + 1} transformed bounds:`, transformedBounds);

        // Scale the bounding box coordinates to actual image dimensions
        let cropX = Math.round(x * scaleX);
        let cropY = Math.round(y * scaleY);
        let cropWidth = Math.round(faceWidth * scaleX);
        let cropHeight = Math.round(faceHeight * scaleY);

        console.log(
          `Face ${i + 1} orientation-aware crop coordinates:`,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
        );

        // Ensure coordinates are within image bounds and positive
        cropX = Math.max(0, Math.min(cropX, actualImageWidth - 1));
        cropY = Math.max(0, Math.min(cropY, actualImageHeight - 1));
        cropWidth = Math.max(50, Math.min(cropWidth, actualImageWidth - cropX));
        cropHeight = Math.max(
          50,
          Math.min(cropHeight, actualImageHeight - cropY),
        );

        // Validate final crop region
        if (cropWidth < 50 || cropHeight < 50) {
          console.warn(
            `Face ${
              i + 1
            }: Too small after orientation-aware scaling (${cropWidth}x${cropHeight}), skipping`,
          );
          continue;
        }

        // Create crop region with orientation metadata
        const cropRegion = {
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight,
          orientation: currentRotation,
        };

        console.log(`Face ${i + 1} final crop region:`, cropRegion);

        try {
          // Attempt to crop the face image
          const croppedImageUri = await cropFaceImage(
            photo.path,
            cropRegion,
            i + 1,
          );

          if (!croppedImageUri) {
            throw new Error('Cropping returned null URI');
          }

          // Extract face metadata with comprehensive validation
          const landmarks = face.landmarks || {};
          const smilingProbability =
            typeof face.smilingProbability === 'number'
              ? face.smilingProbability
              : 0;
          const leftEyeOpenProbability =
            typeof face.leftEyeOpenProbability === 'number'
              ? face.leftEyeOpenProbability
              : 0;
          const rightEyeOpenProbability =
            typeof face.rightEyeOpenProbability === 'number'
              ? face.rightEyeOpenProbability
              : 0;

          croppedFacesData.push({
            uri: croppedImageUri,
            position: { x, y },
            size: { width: faceWidth, height: faceHeight },
            originalBounds: bounds,
            transformedBounds,
            scaledBounds: cropRegion,
            faceId: i + 1,
            rotation: currentRotation,
            landmarks,
            probabilities: {
              smiling: smilingProbability,
              leftEyeOpen: leftEyeOpenProbability,
              rightEyeOpen: rightEyeOpenProbability,
            },
            cropTime: new Date().toISOString(),
            success: true,
          });

          successfulFaces++;
          console.log(
            `Face ${i + 1}: Successfully processed with orientation handling`,
          );
        } catch (cropError) {
          console.error(`Face ${i + 1}: Failed to crop face:`, cropError);

          // Add failed face with comprehensive error info
          croppedFacesData.push({
            uri: null,
            position: { x: transformedBounds.x, y: transformedBounds.y },
            size: {
              width: transformedBounds.width,
              height: transformedBounds.height,
            },
            originalBounds: bounds,
            transformedBounds,
            scaledBounds: cropRegion,
            faceId: i + 1,
            rotation: currentRotation,
            error: cropError.message,
            errorType: cropError.name,
            cropTime: new Date().toISOString(),
            success: false,
          });
        }
      }

      console.log(
        `Face processing completed: ${successfulFaces}/${faces.length} successful, ` +
          `${croppedFacesData.length} total results`,
      );

      if (successfulFaces > 0) {
        setCroppedFaces(croppedFacesData);
        setShowPreview(true);
        console.log('Face cropping successful, showing preview');
      } else {
        console.warn('No faces were successfully processed');
        Alert.alert(
          'Face Processing',
          'No faces could be processed. Please ensure faces are visible and try again.',
          [{ text: 'OK', style: 'default' }],
        );
      }

      // Log summary for debugging
      console.log('Face processing summary:', {
        totalFaces: faces.length,
        processedFaces: croppedFacesData.length,
        successfulFaces,
        failedFaces: croppedFacesData.length - successfulFaces,
        currentRotation,
        imageDimensions: { width: actualImageWidth, height: actualImageHeight },
        screenDimensions: { width, height },
      });
    } catch (error) {
      console.error('Error in captureAndCropFaces');
      Alert.alert('Processing Error', 'Failed to capture and crop faces', [
        { text: 'OK', style: 'default' },
      ]);
    } finally {
      setIsProcessing(false);
      console.log('Face processing completed, processing state reset');
    }
  };
};

/**
 * Enhanced face detection callback with comprehensive validation and dynamic rotation handling
 */
export const createHandleFacesDetected = (
  width,
  height,
  currentRotation,
  setDetectedFaces,
  previousFacesRef,
  lastUpdateTime,
  UPDATE_THROTTLE,
  aFaceW,
  aFaceH,
  aFaceX,
  aFaceY,
  aRot,
  withTiming,
) => {
  return (faces, frame) => {
    const now = Date.now();

    // Throttle updates
    if (now - lastUpdateTime.current < UPDATE_THROTTLE) {
      return;
    }

    lastUpdateTime.current = now;

    if (!faces || !Array.isArray(faces)) {
      console.error('handleFacesDetected: Invalid faces array', faces);
      setDetectedFaces([]);
      previousFacesRef.current = [];
      return;
    }

    console.log(
      `handleFacesDetected: Processing ${faces.length} faces with rotation ${currentRotation}`,
    );

    // Validate and filter faces with comprehensive error handling
    const validatedFaces = faces
      .map((face, index) => validateFaceObject(face, index + 1))
      .filter(face => face !== null);

    console.log(
      `handleFacesDetected: ${validatedFaces.length}/${faces.length} faces validated successfully`,
    );

    // Check for face changes with orientation-aware comparison
    const previousFaces = previousFacesRef.current;
    let facesChanged = previousFaces.length !== validatedFaces.length;

    if (!facesChanged && validatedFaces.length > 0) {
      for (let i = 0; i < validatedFaces.length; i++) {
        const prevFace = previousFaces[i];
        const currentFace = validatedFaces[i];

        if (!prevFace) {
          facesChanged = true;
          break;
        }

        // Transform previous face bounds to current rotation for accurate comparison
        const prevTransformedBounds = transformBoundsForRotation(
          prevFace.bounds || { x: 0, y: 0, width: 0, height: 0 },
          currentRotation,
          width,
          height,
        );

        const currentTransformedBounds = transformBoundsForRotation(
          currentFace.bounds,
          currentRotation,
          width,
          height,
        );

        if (
          Math.abs(prevTransformedBounds.x - currentTransformedBounds.x) > 1 ||
          Math.abs(prevTransformedBounds.y - currentTransformedBounds.y) > 1 ||
          Math.abs(
            prevTransformedBounds.width - currentTransformedBounds.width,
          ) > 1 ||
          Math.abs(
            prevTransformedBounds.height - currentTransformedBounds.height,
          ) > 1
        ) {
          facesChanged = true;
          break;
        }
      }
    }

    // Update state with validated faces
    if (facesChanged) {
      setDetectedFaces(validatedFaces);
      previousFacesRef.current = validatedFaces.map(face => ({
        ...face,
        rotation: currentRotation,
        timestamp: Date.now(),
      }));
      console.log(
        'handleFacesDetected: Face state updated with validated faces',
      );
    }

    // Update animation values with orientation-aware bounds
    if (validatedFaces.length > 0) {
      const firstFace = validatedFaces[0];

      // Transform bounds based on current rotation for accurate animation
      const transformedBounds = transformBoundsForRotation(
        firstFace.bounds,
        currentRotation,
        width,
        height,
      );

      const {
        width: animWidth,
        height: animHeight,
        x: animX,
        y: animY,
      } = transformedBounds;

      console.log(
        `handleFacesDetected: Updating animation with transformed bounds:`,
        transformedBounds,
      );

      aFaceW.value = withTiming(animWidth, { duration: 50 });
      aFaceH.value = withTiming(animHeight, { duration: 50 });
      aFaceX.value = withTiming(animX, { duration: 50 });
      aFaceY.value = withTiming(animY, { duration: 50 });
      aRot.value = withTiming(currentRotation, { duration: 50 });
    } else {
      // Reset animation values when no faces detected
      aFaceW.value = withTiming(0, { duration: 50 });
      aFaceH.value = withTiming(0, { duration: 50 });
      aFaceX.value = withTiming(0, { duration: 50 });
      aFaceY.value = withTiming(0, { duration: 50 });
      aRot.value = withTiming(0, { duration: 50 });
      console.log(
        'handleFacesDetected: No faces detected, reset animation values',
      );
    }
  };
};
