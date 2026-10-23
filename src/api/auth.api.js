import apiClient, { setAccessToken, clearAccessToken } from './client'

/**
 * Authentication API Service
 * Interacts with StackStorm Backend Auth Endpoints (STORM-012, STORM-013, STORM-014)
 */
export const authApi = {
  /**
   * Log in customer with email and password
   */
  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password })
    const token = res.data?.token || res.data?.accessToken
    if (token) {
      setAccessToken(token)
    }
    return res
  },

  /**
   * Register a new customer
   */
  async register(userData) {
    const res = await apiClient.post('/auth/register', userData)
    const token = res.data?.token || res.data?.accessToken
    if (token) {
      setAccessToken(token)
    }
    return res
  },

  /**
   * Logout customer and clear session tokens
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      clearAccessToken()
    }
  },

  /**
   * Explicitly trigger refresh token rotation
   */
  async refreshToken() {
    const res = await apiClient.post('/auth/refresh-token')
    const token = res.data?.token || res.data?.accessToken
    if (token) {
      setAccessToken(token)
    }
    return res
  },

  /**
   * Fetch authenticated customer profile
   */
  async getProfile() {
    return apiClient.get('/users/profile')
  },
}

export default authApi
