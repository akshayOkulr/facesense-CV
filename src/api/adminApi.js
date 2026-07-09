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

export const enrollFace = async (
  ipAddress,
  token,
  studentId,
  imageUri,
  isTeacher = false,
) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!studentId) {
    throw new Error('No student/teacher ID provided');
  }

  if (!imageUri) {
    throw new Error('No image URI provided');
  }

  const captureDate = new Date().toISOString();
  const cleanImageUri = imageUri.replace(/^file:\/\/file:\/\//, 'file://');

  const formData = new FormData();

  if (isTeacher) {
    formData.append('User_id', studentId);
    formData.append('Capture_Date', captureDate);
    formData.append('file', {
      uri: cleanImageUri,
      type: 'image/jpeg',
      name: `teacher_${studentId}.jpg`,
    });
  } else {
    formData.append('Student_id', studentId);
    formData.append('Capture_Date', captureDate);
    formData.append('file', {
      uri: cleanImageUri,
      type: 'image/jpeg',
      name: `student_${studentId}.jpg`,
    });
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.post(
      isTeacher ? '/api/t1/enroll-teacher' : '/api/t1/enroll-student',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 60000,
      },
    );

    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to enroll face');
  }
};

export const getTeachers = async (ipAddress, token, searchText) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  let url = '/admin/user/get-teacher';

  if (searchText) {
    url += `?search=${encodeURIComponent(searchText)}`;
  }

  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch teachers');
  }
};

export const getStudents = async (
  ipAddress,
  token,
  classId,
  sectionId,
  searchText,
) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  let url = '/admin/student/get-all-student';

  const params = [];
  if (classId) params.push(`Class_id=${encodeURIComponent(classId)}`);
  if (sectionId) params.push(`Section_id=${encodeURIComponent(sectionId)}`);
  if (searchText) params.push(`search=${encodeURIComponent(searchText)}`);
  if (params.length > 0) {
    url += '?' + params.join('&');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch students');
  }
};

export const getClasses = async (ipAddress, token) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(
      '/admin/masters/get-only-class-list',
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch classes');
  }
};

export const getSections = async (ipAddress, token, classId) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!classId) {
    throw new Error('No class ID provided');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(
      `/admin/masters/sections/${classId}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch sections');
  }
};

export const getPeriods = async (ipAddress, token, classId, sectionId) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  if (!classId) {
    throw new Error('No class ID provided');
  }

  if (!sectionId) {
    throw new Error('No section ID provided');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(
      `/admin/masters/periods/${classId}/${sectionId}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch periods');
  }
};

export const getAllSubjects = async (ipAddress, token) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = getAxiosInstance(ipAddress, 4005);

  try {
    const response = await axiosInstance.get(
      '/admin/masters/get-all-subjects',
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch subjects');
  }
};
