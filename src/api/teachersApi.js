import { Platform } from 'react-native';
import base64 from 'react-native-base64';
import { createAxiosInstance } from './axiosConfig';

// Create a axios instance for the default IP (HTTP)
const getAxiosInstance = (ipAddress, port = 4005) =>
  createAxiosInstance(ipAddress, port);

// Helper function to handle errors consistently
const handleApiError = (error, defaultMessage) => {
  if (error.response) {
    throw new Error(
      error.response.data?.message ||
        error.response.data?.error ||
        defaultMessage,
    );
  }
  if (error.request) {
    throw new Error(
      'Network error: No response from server. Check IP address and server status.',
    );
  }
  throw new Error(error.message || defaultMessage);
};

export const generateSessionId = async (
  ipAddress,
  token,
  classId,
  sectionId,
  periodId,
  subjectId,
  userId,
) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!classId) {
    throw new Error('No class ID provided');
  }

  if (!sectionId) {
    throw new Error('No section ID provided');
  }

  if (!periodId) {
    throw new Error('No period ID provided');
  }

  if (!subjectId) {
    throw new Error('No subject ID provided');
  }

  if (!userId) {
    throw new Error('No user ID provided');
  }

  const body = {
    Class_id: classId,
    Section_id: sectionId,
    Period_id: periodId,
    Subject_id: subjectId,
    User_id: userId,
  };

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.post(
      '/admin/user/generate-sessionId',
      body,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to generate session ID');
  }
};

export const getTeachersAttendance = async (ipAddress, token, sessionId) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!sessionId) {
    throw new Error('No session ID provided');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(
      `/admin/user/get-teachers-attendance?Session_id=${sessionId}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    console.log('Attendance ==>', response);

    return response.data;
  } catch (error) {
    console.log('error===>', error);
    handleApiError(error, 'Failed to get teachers attendance');
  }
};

export const recognizeTeacher = async (
  ipAddress,
  imageUri,
  sessionId,
  token,
) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!imageUri) {
    throw new Error('No image URI provided');
  }

  if (!sessionId) {
    throw new Error('No session ID provided');
  }

  const captureDate = new Date().toISOString();
  const formData = new FormData();

  const fileObject = {
    uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
    type: 'image/jpeg',
    name: `teacher_face_${captureDate}.jpg`,
  };

  formData.append('file', fileObject);
  formData.append('Session_id', sessionId);
  console.log(sessionId);

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    console.log('[recognizeTeacher] Request:', {
      url: '/api/r1/recognize-teacher',
      sessionId,
      imageUri,
      formDataKeys: ['file', 'Session_id'],
    });

    const response = await axiosInstance.post(
      '/api/r1/recognize-teacher',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    console.log('[recognizeTeacher] Response:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.log('[recognizeTeacher] Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    handleApiError(error, 'Failed to recognize teacher');
  }
};

// Student Attendance API Functions
export const getStudentsAttendanceMArked = async (ipAddress, sessionId) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!sessionId) {
    throw new Error('No session ID provided');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(
      `/admin/student/get-student-attendance?Session_id=${sessionId}`,
    );

    return response.data;
  } catch (error) {
    console.log('error===>', error);
    handleApiError(error, 'Failed to get students attendance');
  }
};

export const recognizeStudent = async (
  ipAddress,
  imageUri,
  sessionId,
  token,
) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!imageUri) {
    throw new Error('No image URI provided');
  }

  if (!sessionId) {
    throw new Error('No session ID provided');
  }

  const captureDate = new Date().toISOString();
  const formData = new FormData();

  const fileObject = {
    uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
    type: 'image/jpeg',
    name: `student_face_${captureDate}.jpg`,
  };

  formData.append('file', fileObject);
  formData.append('Session_id', sessionId);
  console.log(sessionId);

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.post(
      '/api/r1/recognize-student',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    console.log(response);

    return response.data;
  } catch (error) {
    console.log('Failed to recognize student', error);
    handleApiError(error, 'Failed to recognize student');
  }
};

export const getStudentsList = async (ipAddress, token, sessionId) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!sessionId) {
    throw new Error('No session ID provided');
  }

  const newSessionId = base64.encode(sessionId);

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(
      `/admin/student/get-student-attendance-per-class?sid=${newSessionId}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    console.log('Student Attendance ==>', response);

    return response.data;
  } catch (error) {
    console.log('error===>', error);
    handleApiError(error, 'Failed to get students attendance');
  }
};

export const getTeachersSessions = async (ipAddress, token, date) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!date) {
    throw new Error('No date provided');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(
      `/admin/user/get-teachers-sessions?date=${date}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    console.log('Teachers Sessions ==>', response);

    return response.data;
  } catch (error) {
    console.log('error===>', error);
    handleApiError(error, 'Failed to get teachers sessions');
  }
};
