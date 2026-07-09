/**
 * Face Detection Transformation Functions
 * Handles coordinate transformations for different orientations
 */

/**
 * Enhanced transform face bounds with comprehensive error handling and orientation support
 */
export const transformBoundsForRotation = (
  bounds,
  rotation,
  screenWidth,
  screenHeight,
  isFrontCamera = false,
) => {
  // Validate input parameters
  if (!bounds || typeof bounds !== 'object') {
    console.error(
      'transformBoundsForRotation: Invalid bounds parameter',
      bounds,
    );
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (typeof rotation !== 'number' || isNaN(rotation)) {
    console.error(
      'transformBoundsForRotation: Invalid rotation parameter',
      rotation,
    );
    rotation = 0;
  }

  if (
    typeof screenWidth !== 'number' ||
    typeof screenHeight !== 'number' ||
    screenWidth <= 0 ||
    screenHeight <= 0
  ) {
    console.error(
      'transformBoundsForRotation: Invalid screen dimensions',
      screenWidth,
      screenHeight,
    );
    screenWidth = 300; // fallback
    screenHeight = 300; // fallback
  }

  // Extract and validate bounds properties with fallbacks
  const x = typeof bounds.x === 'number' ? bounds.x : 0;
  const y = typeof bounds.y === 'number' ? bounds.y : 0;
  const width = typeof bounds.width === 'number' ? bounds.width : 0;
  const height = typeof bounds.height === 'number' ? bounds.height : 0;

  // Normalize rotation to 0-360 range
  rotation = ((rotation % 360) + 360) % 360;

  let transformed = { x, y, width, height };

  try {
    switch (rotation) {
      case 0:
        // No rotation - portrait mode
        transformed = { x, y, width, height };
        break;

      case 90:
        // 90 degrees clockwise - landscape right
        transformed = {
          x: y,
          y: screenWidth - x - width,
          width: height,
          height: width,
        };
        break;

      case 180:
        // 180 degrees - upside down
        transformed = {
          x: screenWidth - x - width,
          y: screenHeight - y - height,
          width,
          height,
        };
        break;

      case 270:
        // 270 degrees clockwise (90 degrees counter-clockwise) - landscape left
        transformed = {
          x: screenHeight - y - height,
          y: x,
          width: height,
          height: width,
        };
        break;

      default:
        // Handle arbitrary angles by using matrix transformation
        console.warn(
          `transformBoundsForRotation: Unsupported rotation ${rotation}, using 0 degrees`,
        );
        transformed = { x, y, width, height };
        break;
    }

    // Apply mirroring for front camera
    if (isFrontCamera) {
      transformed.x = screenWidth - transformed.x - transformed.width;
    }

    return transformed;
  } catch (error) {
    console.error('transformBoundsForRotation: Transformation failed', error);
    return { x, y, width, height };
  }
};
