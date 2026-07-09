/**
 * Face Detection Components Index
 * Centralized exports for all face detection modules
 */

// Export components
export { default as FaceBoundingBox } from './FaceBoundingBox';
export { default as CroppedFacePreview } from './CroppedFacePreview';

// Export utility functions
export {
  validateFaceObject,
  cropFaceImage,
  handleCameraMountError,
} from './utils';

// Export transformation functions
export { transformBoundsForRotation } from './transformations';

// Export face processing functions
export {
  createCaptureAndCropFaces,
  createHandleFacesDetected,
} from './faceProcessing';
