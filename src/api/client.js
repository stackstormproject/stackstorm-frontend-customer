import axios from 'axios';

let inMemoryAccessToken = null;
let isRefreshing = false;
let failedQueue = [];
let guestSessionId = null;

/**
 * Guest session ID generator and getter (persists in localStorage)
 */
export const getGuestSessionId = () => {
  if (!guestSessionId) {
    try {
      guestSessionId = localStorage.getItem('stackstorm_guest_session_id');
      if (!guestSessionId) {
        guestSessionId = `guest_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
        localStorage.setItem('stackstorm_guest_session_id', guestSessionId);
      }
    } catch {
      guestSessionId = `guest_${Date.now()}`;
    }
  }
  return guestSessionId;
};

/**
 * Process queued requests waiting for a fresh access token
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Access token setter & getter
 */
export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
  if (token) {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('stackstorm_token', token);
      localStorage.setItem('stackstorm_auth_token', token);
    } catch (_) {}
  }
};

export const getAccessToken = () => {
  try {
    const storedToken =
      localStorage.getItem('token') ||
      localStorage.getItem('stackstorm_token') ||
      localStorage.getItem('stackstorm_auth_token');
    if (!storedToken) {
      inMemoryAccessToken = null;
    } else if (!inMemoryAccessToken) {
      inMemoryAccessToken = storedToken;
    }
  } catch {
    // Retain in-memory token if localStorage is blocked/inaccessible
  }
  return inMemoryAccessToken;
};

export const clearAccessToken = () => {
  inMemoryAccessToken = null;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('stackstorm_token');
    localStorage.removeItem('stackstorm_auth_token');
    localStorage.removeItem('stackstorm_user');
  } catch (_) {}
};

/**
 * Centralized Axios API Client instance
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor: Attach in-memory JWT Access Token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const sessId = getGuestSessionId();
    if (sessId && !config.headers['x-guest-session-id'] && !config.headers['x-session-id']) {
      config.headers['x-guest-session-id'] = sessId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Unwrap standardized JSON:API envelope and handle single-flight 401 auto-refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return standard response body directly for developer ergonomics
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If no response received (network failure, timeout, etc.)
    if (!error.response) {
      return Promise.reject(
        new Error('Network error: Unable to connect to StackStorm API Gateway')
      );
    }

    const { status, data } = error.response;
    const isAuthEndpoint =
      originalRequest.url &&
      (originalRequest.url.includes('/auth/refresh-token') ||
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/auth/admin/login') ||
        originalRequest.url.includes('/auth/logout'));

    // Handle 401 Unauthorized token expiry with single-use rotation (only for protected API endpoints, never auth endpoints)
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Enqueue concurrent requests while single refresh promise resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dispatch exactly ONE refresh request via withCredentials HTTP-only cookie
        const refreshResponse = await apiClient.post('/auth/refresh-token');
        const newAccessToken = refreshResponse.data?.token || refreshResponse.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('Refresh response did not return a valid access token');
        }

        setAccessToken(newAccessToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Standardize error message from backend envelope
    const errorMessage =
      data?.message ||
      data?.errors?.[0]?.message ||
      error.message ||
      'An unexpected error occurred';
    const enrichedError = new Error(errorMessage);
    enrichedError.status = status;
    enrichedError.data = data;
    enrichedError.errors = data?.errors || [];

    return Promise.reject(enrichedError);
  }
);

export default apiClient;
