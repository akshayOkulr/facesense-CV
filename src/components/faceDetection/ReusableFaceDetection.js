import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera-face-detector';
import { ClipOp, Skia, TileMode } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import FaceBoundingBox from './FaceBoundingBox';
import CroppedFacePreview from './CroppedFacePreview';

import {
  validateFaceObject,
  cropFaceImage,
  handleCameraMountError,
} from './utils';

import { transformBoundsForRotation } from './transformations';
import { Flash, FlipCamera } from '../../assets';

const ReusableFaceDetection = forwardRef(
  (
    {
      // Configuration props
      mode = 'multi', // 'single' or 'multi'
      enableCropping = true,
      cropPadding = 0.5, // 50% padding for single-face mode
      onFacesDetected,
      onFaceCapture,
      onError,
      cameraFacing = 'back',
      orientation = 'portrait',
      autoMode = true,
      showModeToggle = false,
      showCaptureButton = true,
      showFaceCounter = true,
      customStyles = {},
      showPreview = true,
      showAlerts = true,
      onBack,
      showFlash = false,
      showCameraFlip = false,
      ...otherProps
    },
    ref,
  ) => {
    const { width, height } = useWindowDimensions();
    const { hasPermission, requestPermission } = useCameraPermission();

    const faceDetectionOptions = useRef({
      performanceMode: 'accurate',
      classificationMode: 'all',
      contourMode: 'all',
      landmarkMode: 'all',
      windowWidth: width,
      windowHeight: height,
      trackingEnabled: true,
    }).current;

    const [torch, setTorch] = useState('off'); // 'on' | 'off'
    const [cameraPosition, setCameraPosition] = useState(cameraFacing);

    const cameraDevice = useCameraDevice(cameraPosition);
    const camera = useRef(null);

    const [detectedFaces, setDetectedFaces] = useState([]);
    const [capturedImage, setCapturedImage] = useState(null);
    const [croppedFaces, setCroppedFaces] = useState([]);
    const [showPreviewScreen, setShowPreviewScreen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentRotation, setCurrentRotation] = useState(0);
    const [detectionMode, setDetectionMode] = useState(mode);

    const previousFacesRef = useRef([]);
    const lastUpdateTime = useRef(0);
    const UPDATE_THROTTLE = 16;

    const aFaceW = useSharedValue(0);
    const aFaceH = useSharedValue(0);
    const aFaceX = useSharedValue(0);
    const aFaceY = useSharedValue(0);
    const aRot = useSharedValue(0);

    useEffect(() => {
      const setupCameraPermissions = async () => {
        try {
          if (!hasPermission) {
            const permissionStatus = await requestPermission();

            if (!permissionStatus) {
              const errorMessage =
                'Camera permission required for face detection';
              if (showAlerts) {
                Alert.alert('Camera Permission Required', errorMessage, [
                  { text: 'OK', style: 'default' },
                ]);
              }
              onError?.(new Error(errorMessage));
            }
          }
        } catch (error) {
          console.error('Permission setup failed:', error);
          const errorMessage = `Failed to set up camera permissions: ${error.message}`;
          Alert.alert('Permission Error', errorMessage, [
            { text: 'OK', style: 'default' },
          ]);
          onError?.(error);
        }
      };

      setupCameraPermissions();
    }, [hasPermission, requestPermission, onError]);

    useEffect(() => {
      let rotation = 0;
      if (orientation === 'landscape-left') {
        rotation = 90;
      } else if (orientation === 'landscape-right') {
        rotation = 270;
      }
      setCurrentRotation(rotation);
      aRot.value = rotation;
    }, [orientation]);

    useEffect(() => {
      if (!cameraDevice) {
        const errorMessage =
          'No camera device found. Please check your device camera.';
        if (showAlerts) {
          Alert.alert('Camera Not Available', errorMessage, [
            { text: 'OK', style: 'default' },
          ]);
        }
        onError?.(new Error(errorMessage));
      } else {
        console.log('Camera device ready:', cameraDevice.name);
      }
    }, [cameraDevice, onError]);

    useEffect(() => {
      if (cameraPosition === 'front' && torch === 'on') {
        setTorch('off');
      }
    }, [cameraPosition, torch]);

    function handleUiRotation(rotation) {
      aRot.value = rotation;
      setCurrentRotation(rotation);
    }

    const cropFaceImageWithPadding = async (
      photoPath,
      cropRegion,
      faceIndex,
      padding = 0,
    ) => {
      if (!photoPath || !cropRegion) {
        throw new Error(`Invalid crop parameters for face ${faceIndex}`);
      }

      const paddedRegion = {
        x: Math.max(0, cropRegion.x - (cropRegion.width * padding) / 2),
        y: Math.max(0, cropRegion.y - (cropRegion.height * padding) / 2),
        width: cropRegion.width * (1 + padding),
        height: cropRegion.height * (1 + padding),
      };

      return await cropFaceImage(photoPath, paddedRegion, faceIndex);
    };

    const captureAndCropFaces = useCallback(
      async faces => {
        if (!camera.current || !faces || faces.length === 0) {
          console.warn('captureAndCropFaces: No camera or faces available');
          return;
        }

        let facesToProcess = faces;
        if (detectionMode === 'single' && faces.length > 1) {
          facesToProcess = [
            faces.reduce((largest, current) => {
              const currentArea =
                current.bounds?.width * current.bounds?.height || 0;
              const largestArea =
                largest.bounds?.width * largest.bounds?.height || 0;
              return currentArea > largestArea ? current : largest;
            }),
          ];
        }

        try {
          setIsProcessing(true);

          const photo = await camera.current.takePhoto({
            quality: 0.9,
            enableAutoRedEyeReduction: true,
            enableAutoDistortionCorrection: true,
            enableAutoStabilization: true,
          });

          if (!photo || !photo.path) {
            throw new Error('Invalid photo captured: missing path');
          }

          setCapturedImage(photo);

          const actualImageWidth =
            typeof photo.width === 'number' ? photo.width : width;
          const actualImageHeight =
            typeof photo.height === 'number' ? photo.height : height;

          if (actualImageWidth <= 0 || actualImageHeight <= 0) {
            throw new Error(
              `Invalid image dimensions: ${actualImageWidth}x${actualImageHeight}`,
            );
          }

          let scaleX = actualImageWidth / width;
          let scaleY = actualImageHeight / height;

          if (currentRotation === 90 || currentRotation === 270) {
            scaleX = actualImageWidth / height;
            scaleY = actualImageHeight / width;
          }

          const croppedFacesData = [];
          let successfulFaces = 0;
          const padding = detectionMode === 'single' ? cropPadding : 0;

          for (let i = 0; i < facesToProcess.length; i++) {
            const face = facesToProcess[i];

            if (!face) {
              console.error(`Face ${i + 1}: Face object is null or undefined`);
              continue;
            }

            let bounds = face.bounds;
            if (!bounds) {
              console.error(`Face ${i + 1}: Missing bounds property`);
              continue;
            }

            const transformedBounds = transformBoundsForRotation(
              bounds,
              currentRotation,
              width,
              height,
              cameraFacing === 'front',
            );

            if (
              !transformedBounds ||
              typeof transformedBounds.x !== 'number' ||
              typeof transformedBounds.y !== 'number' ||
              typeof transformedBounds.width !== 'number' ||
              typeof transformedBounds.height !== 'number'
            ) {
              continue;
            }

            const {
              x,
              y,
              width: faceWidth,
              height: faceHeight,
            } = transformedBounds;

            // Scale the bounding box coordinates to actual image dimensions
            let cropX = Math.round(x * scaleX);
            let cropY = Math.round(y * scaleY);
            let cropWidth = Math.round(faceWidth * scaleX);
            let cropHeight = Math.round(faceHeight * scaleY);

            // Ensure coordinates are within image bounds and positive
            cropX = Math.max(0, Math.min(cropX, actualImageWidth - 1));
            cropY = Math.max(0, Math.min(cropY, actualImageHeight - 1));
            cropWidth = Math.max(
              50,
              Math.min(cropWidth, actualImageWidth - cropX),
            );
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

            try {
              // Use enhanced crop function with padding for single-face mode
              const croppedImageUri = await cropFaceImageWithPadding(
                photo.path,
                cropRegion,
                i + 1,
                padding,
              );

              if (!croppedImageUri) {
                throw new Error('Cropping returned null URI');
              }

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

              const faceData = {
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
                detectionMode,
                padding,
                success: true,
              };

              croppedFacesData.push(faceData);
              successfulFaces++;

              onFaceCapture?.(faceData);
            } catch (cropError) {
              console.error(`Face ${i + 1}: Failed to crop face:`, cropError);

              const failedFaceData = {
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
                detectionMode,
                padding,
                error: cropError.message,
                errorType: cropError.name,
                cropTime: new Date().toISOString(),
                success: false,
              };

              croppedFacesData.push(failedFaceData);
            }
          }

          if (successfulFaces > 0) {
            setCroppedFaces(croppedFacesData);
            if (showPreview) {
              setShowPreviewScreen(true);
            }
          } else {
            const errorMessage =
              'No faces could be processed. Please ensure faces are visible and try again.';
            if (showAlerts) {
              Alert.alert('Face Processing', errorMessage, [
                { text: 'OK', style: 'default' },
              ]);
            }
            onError?.(new Error(errorMessage));
          }
        } catch (error) {
          console.error('Error in captureAndCropFaces:', error);
          const errorMessage = `Failed to capture and crop faces: ${error.message}`;
          if (showAlerts) {
            Alert.alert('Processing Error', errorMessage, [
              { text: 'OK', style: 'default' },
            ]);
          }
          onError?.(error);
        } finally {
          setIsProcessing(false);
        }
      },
      [
        camera,
        width,
        height,
        currentRotation,
        detectionMode,
        cropPadding,
        onFaceCapture,
        onError,
        showPreview,
        cameraFacing,
      ],
    );

    const handleFacesDetected = useCallback(
      (faces, frame) => {
        const now = Date.now();

        // Throttle updates
        if (now - lastUpdateTime.current < UPDATE_THROTTLE) {
          return;
        }

        lastUpdateTime.current = now;

        if (!faces || !Array.isArray(faces)) {
          setDetectedFaces([]);
          previousFacesRef.current = [];
          onFacesDetected?.([]);
          return;
        }

        // Filter faces based on detection mode for UI display
        let displayFaces = faces;
        if (detectionMode === 'single' && faces.length > 1) {
          // For single-face mode, only show the largest face in the UI
          displayFaces = [
            faces.reduce((largest, current) => {
              const currentArea =
                current.bounds?.width * current.bounds?.height || 0;
              const largestArea =
                largest.bounds?.width * largest.bounds?.height || 0;
              return currentArea > largestArea ? current : largest;
            }),
          ];
        }

        // Validate and filter faces with comprehensive error handling
        const validatedFaces = displayFaces
          .map((face, index) => validateFaceObject(face, index + 1))
          .filter(face => face !== null);

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
              cameraFacing === 'front',
            );

            const currentTransformedBounds = transformBoundsForRotation(
              currentFace.bounds,
              currentRotation,
              width,
              height,
              cameraFacing === 'front',
            );

            if (
              Math.abs(prevTransformedBounds.x - currentTransformedBounds.x) >
                1 ||
              Math.abs(prevTransformedBounds.y - currentTransformedBounds.y) >
                1 ||
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

        if (facesChanged) {
          setDetectedFaces(validatedFaces);
          previousFacesRef.current = validatedFaces.map(face => ({
            ...face,
            rotation: currentRotation,
            timestamp: Date.now(),
          }));

          onFacesDetected?.(faces);
        }

        if (validatedFaces.length > 0) {
          const firstFace = validatedFaces[0];

          const transformedBounds = transformBoundsForRotation(
            firstFace.bounds,
            currentRotation,
            width,
            height,
            cameraFacing === 'front',
          );

          const {
            width: animWidth,
            height: animHeight,
            x: animX,
            y: animY,
          } = transformedBounds;

          aFaceW.value = withTiming(animWidth, { duration: 50 });
          aFaceH.value = withTiming(animHeight, { duration: 50 });
          aFaceX.value = withTiming(animX, { duration: 50 });
          aFaceY.value = withTiming(animY, { duration: 50 });
          aRot.value = withTiming(currentRotation, { duration: 50 });
        } else {
          aFaceW.value = withTiming(0, { duration: 50 });
          aFaceH.value = withTiming(0, { duration: 50 });
          aFaceX.value = withTiming(0, { duration: 50 });
          aFaceY.value = withTiming(0, { duration: 50 });
          aRot.value = withTiming(0, { duration: 50 });
        }
      },
      [
        currentRotation,
        width,
        height,
        detectionMode,
        onFacesDetected,
        cameraFacing,
      ],
    );

    // Mode toggle handler
    const toggleMode = useCallback(() => {
      const newMode = detectionMode === 'single' ? 'multi' : 'single';
      setDetectionMode(newMode);
      console.log(
        `Detection mode switched from ${detectionMode} to ${newMode}`,
      );

      // Clear detected faces to refresh display
      setDetectedFaces([]);
      previousFacesRef.current = [];
    }, [detectionMode]);

    // Skia actions handler with orientation support
    const handleSkiaActions = useCallback(
      (faces, frame) => {
        'worklet';

        if (faces.length <= 0) return;

        if (Math.random() < 0.05) {
          console.log('SKIA - faces', faces.length);
        }

        let displayFaces = faces;
        if (detectionMode === 'single' && faces.length > 1) {
          displayFaces = [
            faces.reduce((largest, current) => {
              const currentArea =
                current.bounds?.width * current.bounds?.height || 0;
              const largestArea =
                largest.bounds?.width * largest.bounds?.height || 0;
              return currentArea > largestArea ? current : largest;
            }),
          ];
        }

        displayFaces.forEach((face, index) => {
          if (!face?.bounds) {
            return;
          }

          const transformedBounds = transformBoundsForRotation(
            face.bounds,
            currentRotation,
            width,
            height,
            cameraFacing === 'front',
          );
          const { contours, landmarks } = face;

          const hue = (index * 137.5) % 360;
          const faceColor = Skia.Color(`hsl(${hue}, 70%, 60%)`);
          const blurColor = Skia.Color(`hsla(${hue}, 70%, 60%, 0.3)`);

          const blurRadius = 15;
          const blurFilter = Skia.ImageFilter.MakeBlur(
            blurRadius,
            blurRadius,
            TileMode.Repeat,
            null,
          );
          const blurPaint = Skia.Paint();
          blurPaint.setImageFilter(blurFilter);
          blurPaint.setColor(blurColor);

          const contourPath = Skia.Path.Make();
          const necessaryContours = ['FACE', 'LEFT_CHEEK', 'RIGHT_CHEEK'];

          necessaryContours.forEach(key => {
            contours?.[key]?.forEach((point, pointIndex) => {
              if (pointIndex === 0) {
                contourPath.moveTo(point.x, point.y);
              } else {
                contourPath.lineTo(point.x, point.y);
              }
            });
            contourPath.close();
          });

          frame.save();
          frame.clipPath(contourPath, ClipOp.Intersect, true);
          frame.render(blurPaint);
          frame.restore();

          const mouthPath = Skia.Path.Make();
          const mouthPaint = Skia.Paint();
          mouthPaint.setColor(faceColor);
          mouthPaint.setStrokeWidth(2);
          const necessaryLandmarks = [
            'MOUTH_BOTTOM',
            'MOUTH_LEFT',
            'MOUTH_RIGHT',
          ];

          necessaryLandmarks.forEach((key, landmarkIndex) => {
            const point = landmarks?.[key];
            if (!point) return;

            if (landmarkIndex === 0) {
              mouthPath.moveTo(point.x, point.y);
            } else {
              mouthPath.lineTo(point.x, point.y);
            }
          });
          mouthPath.close();
          frame.drawPath(mouthPath, mouthPaint);

          const rectPaint = Skia.Paint();
          rectPaint.setColor(faceColor);
          rectPaint.setStyle(1);
          rectPaint.setStrokeWidth(2);
          frame.drawRect(transformedBounds, rectPaint);

          if (index < 3) {
            const textPaint = Skia.Paint();
            textPaint.setColor(faceColor);
            textPaint.setStrokeWidth(1);

            const font = Skia.Typeface.MakeFromName(
              'Arial',
              Skia.FontStyle.Bold,
            );
            const text =
              detectionMode === 'single' ? 'Target Face' : `Face ${index + 1}`;

            frame.drawString(
              text,
              face.bounds.x,
              face.bounds.y - 10,
              font,
              14,
              textPaint,
              Skia.TextAlign.Left,
            );
          }
        });
      },
      [currentRotation, width, height, detectionMode, cameraFacing],
    );

    const faceBoundingBoxes = useMemo(() => {
      return detectedFaces.map((face, index) => {
        const faceKey = `face-${index}-${Math.round(
          (face?.bounds?.x || 0) / 10,
        )}-${Math.round((face?.bounds?.y || 0) / 10)}-${Math.round(
          (face?.bounds?.width || 0) / 10,
        )}`;

        return (
          <FaceBoundingBox
            key={faceKey}
            face={face}
            index={index}
            faceId={faceKey}
            rotation={currentRotation}
            screenWidth={width}
            screenHeight={height}
            isFrontCamera={cameraFacing === 'front'}
          />
        );
      });
    }, [detectedFaces, currentRotation, width, height, cameraFacing]);

    const renderContent = () => {
      if (showPreviewScreen && showPreview) {
        return (
          <CroppedFacePreview
            croppedFaces={croppedFaces}
            onBack={() => {
              setShowPreviewScreen(false);
              setCroppedFaces([]);
              setCapturedImage(null);
            }}
          />
        );
      }

      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          {hasPermission && cameraDevice ? (
            <>
              <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                isActive={true}
                device={cameraDevice}
                onError={handleCameraMountError}
                faceDetectionCallback={handleFacesDetected}
                onUIRotationChanged={handleUiRotation}
                skiaActions={handleSkiaActions}
                faceDetectionOptions={{
                  ...faceDetectionOptions,
                  autoMode,
                  cameraFacing,
                }}
                torch={torch}
                photo={true}
                videoStabilizationMode="cinematic-extended"
                enableBufferCompression={false}
                {...otherProps}
              />

              {showModeToggle && (
                <TouchableOpacity
                  style={[
                    styles.modeToggleButton,
                    detectionMode === 'single'
                      ? styles.singleModeActive
                      : styles.multiModeActive,
                    customStyles.modeToggleButton,
                  ]}
                  onPress={toggleMode}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      detectionMode === 'single'
                        ? styles.singleModeText
                        : styles.multiModeText,
                    ]}
                  >
                    {detectionMode === 'single' ? 'Single Face' : 'Multi Face'}
                  </Text>
                </TouchableOpacity>
              )}

              {showFaceCounter && (
                <View style={[styles.faceCounter, customStyles.faceCounter]}>
                  <Text style={styles.faceCounterText}>
                    {detectionMode === 'single'
                      ? detectedFaces.length > 0
                        ? 'Face Ready'
                        : 'Position face in frame'
                      : `Faces Detected: ${detectedFaces.length}`}
                  </Text>
                  {isProcessing && (
                    <Text style={styles.processingText}>Processing...</Text>
                  )}
                </View>
              )}

              {showCaptureButton && (
                <View style={styles.cameraButtonContainer}>
                  {showFlash ? (
                    <TouchableOpacity
                      onPress={() => {
                        if (cameraPosition === 'back') {
                          setTorch(prev => (prev === 'on' ? 'off' : 'on'));
                        }
                      }}
                      disabled={cameraPosition === 'front'}
                    >
                      <Flash />
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}
                  <TouchableOpacity
                    style={[
                      styles.manualCaptureButton,
                      detectionMode === 'single'
                        ? styles.singleModeButton
                        : styles.multiModeButton,
                      customStyles.manualCaptureButton,
                      isProcessing && styles.disabledButton,
                    ]}
                    onPress={() => captureAndCropFaces(detectedFaces)}
                    disabled={
                      isProcessing ||
                      (detectionMode === 'single' && detectedFaces.length === 0)
                    }
                  />
                  {showCameraFlip ? (
                    <TouchableOpacity
                      onPress={() => {
                        setTorch('off');
                        setCameraPosition(prev =>
                          prev === 'back' ? 'front' : 'back',
                        );
                      }}
                    >
                      <FlipCamera />
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}
                </View>
              )}

              {faceBoundingBoxes}
            </>
          ) : (
            <Text
              style={{
                width: '100%',
                textAlign: 'center',
                color: 'black',
              }}
            >
              No camera device or permission
            </Text>
          )}
        </View>
      );
    };

    // Expose methods through ref
    useImperativeHandle(
      ref,
      () => ({
        captureAndCropFaces: () => {
          if (detectedFaces.length > 0) {
            captureAndCropFaces(detectedFaces);
          } else {
            console.warn('No faces detected for capture');
            onError?.(new Error('No faces detected for capture'));
          }
        },
        getDetectedFaces: () => detectedFaces,
        isProcessing: () => isProcessing,
      }),
      [detectedFaces, isProcessing, captureAndCropFaces, onError],
    );

    try {
      return (
        <SafeAreaView style={[styles.container, customStyles.container]}>
          {renderContent()}
        </SafeAreaView>
      );
    } catch (error) {
      console.error('ReusableFaceDetection: Critical render error:', error);
      return (
        <SafeAreaView style={[styles.container, customStyles.container]}>
          <View
            style={[
              styles.container,
              {
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'black',
              },
            ]}
          >
            <Text
              style={{
                color: 'red',
                fontSize: 18,
                textAlign: 'center',
                padding: 20,
              }}
            >
              Critical Error: {error.message}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                padding: 15,
                backgroundColor: 'blue',
                borderRadius: 10,
              }}
              onPress={() => {
                // Attempt to recover by resetting state
                setDetectedFaces([]);
                setCroppedFaces([]);
                setCapturedImage(null);
                setShowPreviewScreen(false);
                setIsProcessing(false);
                setCurrentRotation(0);
                onError?.(error);
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  faceCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 1000,
  },
  faceCounterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingText: {
    color: '#00FF00',
    fontSize: 12,
    marginTop: 5,
  },
  manualCaptureButton: {
    zIndex: 1000,
  },
  singleModeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)', // Green for single mode
  },
  multiModeButton: {
    backgroundColor: 'rgba(0, 123, 255, 0.8)', // Blue for multi mode
  },
  manualCaptureText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  disabledText: {
    color: '#cccccc',
  },
  modeToggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
    minWidth: 100,
    alignItems: 'center',
  },
  singleModeActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  multiModeActive: {
    backgroundColor: 'rgba(0, 123, 255, 0.9)',
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  singleModeText: {
    color: 'white',
  },
  multiModeText: {
    color: 'white',
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
  },
});

export default memo(ReusableFaceDetection);
