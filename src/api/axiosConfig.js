import axios from 'axios';

// Network error types for better error handling
export const NetworkErrorType = {
  TIMEOUT: 'TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NO_INTERNET: 'NO_INTERNET',
  UNKNOWN: 'UNKNOWN',
};

// All backends are unified behind one API Gateway host, split by path
// prefix (/auth, /admin, /api/t1, /api/r1) instead of separate ports.
// ipAddress/port args are kept for call-site compatibility but ignored.
export const API_BASE_URL =
  'https://6hh756amy8.execute-api.ap-south-1.amazonaws.com';

const createAxiosInstance = (_ipAddress, _port) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  // Request interceptor for adding headers
  instance.interceptors.request.use(
    config => {
      if (config.headers?.Authorization) {
        const authHeader = config.headers.Authorization;
      }

      config.headers['Accept'] = 'application/json';
      console.log('Axios Request:', config);
      return config;
    },
    error => {
      console.log('Axios Request Error:', error);
      return Promise.reject(error);
    },
  );

  // Response interceptor for comprehensive error handling
  instance.interceptors.response.use(
    response => {
      console.log('Axios Response:', response);
      return response;
    },
    error => {
      console.log('Axios Error Interceptor:', error);

      // Handle different error types
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          message:
            'Request timeout. Please check your connection and try again.',
          type: NetworkErrorType.TIMEOUT,
          originalError: error,
        });
      }

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return Promise.reject({
          message:
            'Unable to connect to server. Please check if the server is running and the IP address is correct.',
          type: NetworkErrorType.NETWORK_ERROR,
          originalError: error,
        });
      }

      if (error.code === 'ECONNREFUSED') {
        return Promise.reject({
          message:
            'Connection refused. The server may be down or the IP address/port may be incorrect.',
          type: NetworkErrorType.CONNECTION_REFUSED,
          originalError: error,
        });
      }

      if (error.response) {
        // Server responded with an error status
        const status = error.response.status;
        let message = error.response.data?.message || 'Server error occurred';

        switch (status) {
          case 400:
            message =
              error.response.data?.message ||
              'Bad request. Please check your input.';
            break;
          case 401:
            message =
              error.response.data?.message ||
              'Unauthorized. Please login again.';
            break;
          case 403:
            message = error.response.data?.message || 'Access forbidden.';
            break;
          case 404:
            message = error.response.data?.message || 'Resource not found.';
            break;
          case 500:
            message =
              error.response.data?.message ||
              'Server error. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            message =
              error.response.data?.message ||
              'Server temporarily unavailable. Please try again later.';
            break;
          default:
            message = error.response.data?.message || 'An error occurred';
        }

        return Promise.reject({
          message,
          type: NetworkErrorType.SERVER_ERROR,
          status,
          data: error.response.data,
          originalError: error,
        });
      }

      // No response received - network issue
      if (error.request) {
        return Promise.reject({
          message:
            'No response from server. Please check your network connection and server status.',
          type: NetworkErrorType.NO_INTERNET,
          originalError: error,
        });
      }

      // Unknown error
      return Promise.reject({
        message:
          error.message || 'An unexpected error occurred. Please try again.',
        type: NetworkErrorType.UNKNOWN,
        originalError: error,
      });
    },
  );

  return instance;
};

// Default instance for common use (HTTP)
export const defaultAxios = createAxiosInstance('192.168.0.129', 4005);

// Export the factory function for custom IP/port
export { createAxiosInstance };

export default {
  createAxiosInstance,
  defaultAxios,
  NetworkErrorType,
};
