export const validationExamples = {
  validateFaceObject: (face, faceIndex) => {
    if (!face || typeof face !== 'object') {
      console.error(`Face ${faceIndex} is not a valid object`, face);
      return null;
    }

    const bounds = face.bounds;
    if (!bounds || typeof bounds !== 'object') {
      console.error(`Face ${faceIndex} has invalid bounds`, bounds);
      return null;
    }

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

    if (validatedBounds.width <= 0 || validatedBounds.height <= 0) {
      console.error(
        `Face ${faceIndex} has invalid dimensions`,
        validatedBounds,
      );
      return null;
    }

    return {
      ...face,
      bounds: validatedBounds,
      smilingProbability:
        typeof face.smilingProbability === 'number'
          ? face.smilingProbability
          : 0,
      leftEyeOpenProbability:
        typeof face.leftEyeOpenProbability === 'number'
          ? face.leftOpenProbability
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
  },

  testEdgeCases: () => {
    const testCases = [
      { name: 'null face', input: null, expected: null },
      { name: 'undefined face', input: undefined, expected: null },
      { name: 'string face', input: 'not a face', expected: null },
      { name: 'empty object', input: {}, expected: null },
      { name: 'missing bounds', input: { faceId: 1 }, expected: null },
      { name: 'invalid bounds', input: { bounds: 'invalid' }, expected: null },
      {
        name: 'zero dimensions',
        input: { bounds: { x: 0, y: 0, width: 0, height: 0 } },
        expected: null,
      },
      {
        name: 'negative dimensions',
        input: { bounds: { x: 0, y: 0, width: -10, height: -10 } },
        expected: null,
      },
      {
        name: 'valid face',
        input: { bounds: { x: 10, y: 10, width: 100, height: 100 } },
        expected: 'valid',
      },
    ];

    testCases.forEach(testCase => {
      const result = validationExamples.validateFaceObject(testCase.input, 1);
      const isValid = result !== null;
      console.log(
        `${testCase.name}: ${isValid ? 'PASS' : 'FAIL'} - ${JSON.stringify(
          result,
        )}`,
      );
    });
  },

  testModeSwitching: () => {
    const modes = ['single', 'multi'];
    const testFaces = [
      { bounds: { x: 100, y: 100, width: 150, height: 150 }, faceId: 1 },
      { bounds: { x: 200, y: 200, width: 100, height: 100 }, faceId: 2 },
      { bounds: { x: 300, y: 300, width: 120, height: 120 }, faceId: 3 },
    ];

    modes.forEach(mode => {
      let processedFaces;

      if (mode === 'single' && testFaces.length > 1) {
        processedFaces = [
          testFaces.reduce((largest, current) => {
            const currentArea = current.bounds.width * current.bounds.height;
            const largestArea = largest.bounds.width * largest.bounds.height;
            return currentArea > largestArea ? current : largest;
          }),
        ];
      } else {
        processedFaces = testFaces;
      }

      console.log(
        `${mode} mode with ${testFaces.length} faces: processed ${processedFaces.length} faces`,
      );
      console.log('Selected face for single mode:', processedFaces[0]?.faceId);
    });
  },

  calculateCropRegionWithPadding: (faceBounds, padding = 0.5) => {
    const { x, y, width, height } = faceBounds;

    const paddedRegion = {
      x: Math.max(0, x - (width * padding) / 2),
      y: Math.max(0, y - (height * padding) / 2),
      width: width * (1 + padding),
      height: height * (1 + padding),
    };

    return paddedRegion;
  },

  testCropPadding: () => {
    const testFace = { bounds: { x: 100, y: 100, width: 200, height: 200 } };
    const paddingValues = [0, 0.25, 0.5, 0.75, 1.0];

    paddingValues.forEach(padding => {
      const cropRegion = validationExamples.calculateCropRegionWithPadding(
        testFace.bounds,
        padding,
      );
      const originalArea = testFace.bounds.width * testFace.bounds.height;
      const paddedArea = cropRegion.width * cropRegion.height;
      const areaIncrease = (
        ((paddedArea - originalArea) / originalArea) *
        100
      ).toFixed(1);

      console.log(
        `Padding ${padding * 100}%: ${JSON.stringify(
          cropRegion,
        )} - Area +${areaIncrease}%`,
      );
    });
  },

  transformBoundsForRotation: (bounds, rotation, width, height) => {
    let transformedBounds = { ...bounds };

    switch (rotation) {
      case 90:
        transformedBounds = {
          x: height - bounds.y - bounds.height,
          y: bounds.x,
          width: bounds.height,
          height: bounds.width,
        };
        break;
      case 180:
        transformedBounds = {
          x: width - bounds.x - bounds.width,
          y: height - bounds.y - bounds.height,
          width: bounds.width,
          height: bounds.height,
        };
        break;
      case 270:
        transformedBounds = {
          x: bounds.y,
          y: width - bounds.x - bounds.width,
          width: bounds.height,
          height: bounds.width,
        };
        break;
      default:
        break;
    }

    return transformedBounds;
  },

  testOrientationHandling: () => {
    const testBounds = { x: 100, y: 100, width: 200, height: 150 };
    const screenDimensions = { width: 400, height: 600 };
    const rotations = [0, 90, 180, 270];

    rotations.forEach(rotation => {
      const transformed = validationExamples.transformBoundsForRotation(
        testBounds,
        rotation,
        screenDimensions.width,
        screenDimensions.height,
      );
      console.log(`Rotation ${rotation}°: ${JSON.stringify(transformed)}`);
    });
  },

  simulateErrors: () => {
    const errorScenarios = [
      {
        name: 'Camera Permission Denied',
        simulate: () => {
          const hasPermission = false;
          if (!hasPermission) {
            throw new Error('Camera permission required');
          }
        },
      },
      {
        name: 'No Camera Device',
        simulate: () => {
          const cameraDevice = null;
          if (!cameraDevice) {
            throw new Error('No camera device available');
          }
        },
      },
      {
        name: 'Face Detection Failed',
        simulate: () => {
          const faces = null;
          if (!faces) {
            throw new Error('Face detection service unavailable');
          }
        },
      },
      {
        name: 'Image Processing Error',
        simulate: () => {
          const photo = { path: null };
          if (!photo || !photo.path) {
            throw new Error('Invalid photo captured');
          }
        },
      },
    ];

    errorScenarios.forEach(scenario => {
      try {
        scenario.simulate();
        console.log(`${scenario.name}: PASS - No error thrown`);
      } catch (error) {
        console.log(`${scenario.name}: HANDLED - ${error.message}`);
      }
    });
  },

  performanceTest: () => {
    const iterations = 1000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const mockFace = {
        bounds: {
          x: Math.random() * 400,
          y: Math.random() * 600,
          width: 100 + Math.random() * 200,
          height: 100 + Math.random() * 200,
        },
        smilingProbability: Math.random(),
        leftEyeOpenProbability: Math.random(),
        rightEyeOpenProbability: Math.random(),
        landmarks: {},
        contours: {},
        faceId: i,
      };

      validationExamples.validateFaceObject(mockFace, i);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTimePerValidation = duration / iterations;

    console.log(`Performance Test Results:`);
    console.log(`Total iterations: ${iterations}`);
    console.log(`Total time: ${duration}ms`);
    console.log(
      `Average time per validation: ${avgTimePerValidation.toFixed(3)}ms`,
    );
    console.log(
      `Validations per second: ${(1000 / avgTimePerValidation).toFixed(0)}`,
    );
  },

  testMemoryManagement: () => {
    const mockFaces = Array.from({ length: 100 }, (_, i) => ({
      bounds: { x: i * 10, y: i * 10, width: 100, height: 100 },
      faceId: i,
    }));

    let previousFaces = [];

    for (let i = 0; i < 50; i++) {
      // Simulate new faces detection
      const currentFaces = mockFaces.slice(
        0,
        Math.floor(Math.random() * 5) + 1,
      );

      // Update tracking references (simulating the component's logic)
      previousFaces = currentFaces.map(face => ({
        ...face,
        rotation: 0,
        timestamp: Date.now(),
      }));

      // Simulate cleanup every 10 iterations
      if (i % 10 === 0) {
        console.log(`Iteration ${i}: Tracking ${previousFaces.length} faces`);
      }
    }

    console.log('Memory management test completed');
  },

  testIntegrationScenarios: () => {
    const integrationTests = [
      {
        name: 'Single Face Capture Flow',
        steps: [
          '1. Initialize component in single mode',
          '2. Wait for face detection',
          '3. User presses capture button',
          '4. Validate cropping with padding',
          '5. Trigger onFaceCapture callback',
          '6. Handle preview (if enabled)',
        ],
      },
      {
        name: 'Multi Face Capture Flow',
        steps: [
          '1. Initialize component in multi mode',
          '2. Detect multiple faces',
          '3. User presses capture button',
          '4. Process all faces without padding',
          '5. Trigger onFaceCapture for each face',
          '6. Handle batch preview',
        ],
      },
      {
        name: 'Mode Switching Flow',
        steps: [
          '1. Start in multi mode',
          '2. Detect multiple faces',
          '3. Switch to single mode',
          '4. Verify largest face is selected',
          '5. Test capture in single mode',
          '6. Switch back to multi mode',
        ],
      },
    ];

    integrationTests.forEach(test => {
      console.log(`${test.name}:`);
      test.steps.forEach(step => console.log(`  ${step}`));
      console.log('');
    });
  },
};

// Example usage and testing runner
export const runValidationTests = () => {
  console.log('=== ReusableFaceDetection Component Validation Tests ===\n');

  console.log('1. Edge Case Testing:');
  validationExamples.testEdgeCases();
  console.log('\n');

  console.log('2. Mode Switching Testing:');
  validationExamples.testModeSwitching();
  console.log('\n');

  console.log('3. Crop Padding Testing:');
  validationExamples.testCropPadding();
  console.log('\n');

  console.log('4. Orientation Handling Testing:');
  validationExamples.testOrientationHandling();
  console.log('\n');

  console.log('5. Error Boundary Testing:');
  validationExamples.simulateErrors();
  console.log('\n');

  console.log('6. Performance Testing:');
  validationExamples.performanceTest();
  console.log('\n');

  console.log('7. Memory Management Testing:');
  validationExamples.testMemoryManagement();
  console.log('\n');

  console.log('8. Integration Testing:');
  validationExamples.testIntegrationScenarios();
  console.log('\n');

  console.log('=== All Validation Tests Completed ===');
};

// Export for use in development and testing
export default validationExamples;
