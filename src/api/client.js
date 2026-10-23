import axios from 'axios'

// In-memory access token storage (protects against XSS attacks)
let inMemoryAccessToken = null
let isRefreshing = false
let failedQueue = []

/**
 * Process queued requests waiting for a fresh access token
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Access token setter & getter
 */
export const setAccessToken = (token) => {
  inMemoryAccessToken = token
}

export const getAccessToken = () => inMemoryAccessToken

export const clearAccessToken = () => {
  inMemoryAccessToken = null
}

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
})

/**
 * Request Interceptor: Attach in-memory JWT Access Token
 */
apiClient.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Response Interceptor: Unwrap standardized JSON:API envelope and handle single-flight 401 auto-refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return standard response body directly for developer ergonomics
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // If no response received (network failure, timeout, etc.)
    if (!error.response) {
      return Promise.reject(new Error('Network error: Unable to connect to StackStorm API Gateway'))
    }

    const { status, data } = error.response
    const isAuthRefresh = originalRequest.url && originalRequest.url.includes('/auth/refresh-token')

    // Handle 401 Unauthorized token expiry with single-use rotation
    if (status === 401 && !originalRequest._retry && !isAuthRefresh) {
      if (isRefreshing) {
        // Enqueue concurrent requests while single refresh promise resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Dispatch exactly ONE refresh request via withCredentials HTTP-only cookie
        const refreshResponse = await apiClient.post('/auth/refresh-token')
        const newAccessToken = refreshResponse.data?.token || refreshResponse.data?.accessToken

        if (!newAccessToken) {
          throw new Error('Refresh response did not return a valid access token')
        }

        setAccessToken(newAccessToken)
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAccessToken()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Standardize error message from backend envelope
    const errorMessage = data?.message || data?.errors?.[0]?.message || error.message || 'An unexpected error occurred'
    const enrichedError = new Error(errorMessage)
    enrichedError.status = status
    enrichedError.data = data
    enrichedError.errors = data?.errors || []

    return Promise.reject(enrichedError)
  },
)

export default apiClient
