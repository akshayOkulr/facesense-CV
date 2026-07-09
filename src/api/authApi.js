import { createAxiosInstance } from './axiosConfig';

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

export const loginUser = async (ipAddress, identifier, password) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = createAxiosInstance(ipAddress, 4010);

  try {
    const response = await axiosInstance.post(
      '/auth/login',
      {
        identifier: identifier,
        Password: password,
        loginType: 'MOBILE',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, 'Login failed');
  }
};

export const createPasswordApi = async (
  ipAddress,
  username,
  password,
  token,
) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = createAxiosInstance(ipAddress, 4010);

  try {
    const response = await axiosInstance.post(
      '/auth/create-password',
      {
        Username: username,
        Password: password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );
    return response.data;
  } catch (error) {
    handleApiError(error, 'Create password failed');
  }
};

export const logoutUser = async (ipAddress, token) => {
  if (!ipAddress) {
    throw new Error('No IP address configured');
  }

  // Use axios instance configured for HTTP
  const axiosInstance = createAxiosInstance(ipAddress, 4010);

  try {
    const response = await axiosInstance.post(
      '/auth/logout',
      {
        loginType: 'MOBILE',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    console.log('Logout API success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Logout API error:', error);
    handleApiError(error, 'Logout failed');
  }
};
