import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Check if this is an OAuth token error (should be handled by the calling code)
      const errorData = error.response?.data as any;
      const errorCode = errorData?.error?.error || errorData?.error;
      
      // Only redirect to login if it's not an OAuth token error
      // OAuth token errors (OAUTH_TOKEN_MISSING, OAUTH_TOKEN_EXPIRED) should be handled
      // by the component that made the request to trigger OAuth flow
      if (errorCode !== 'OAUTH_TOKEN_MISSING' && errorCode !== 'OAUTH_TOKEN_EXPIRED') {
        // Unauthorized - clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
