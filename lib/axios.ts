import axios from 'axios';

const axiosInstance = axios.create({
  // Use relative URLs to work with any domain (Vercel preview URLs, production, etc)
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any auth headers if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't redirect on 401 for profile check - let the component handle it
    // Only redirect for other authenticated requests
    if (error.response?.status === 401 && !error.config.url?.includes('/api/auth/profile')) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
