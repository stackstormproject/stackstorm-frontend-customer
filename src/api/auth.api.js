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
    const payload = res?.data || res
    const token = payload?.token || payload?.accessToken
    if (token) {
      setAccessToken(token)
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('stackstorm_token', token)
      } catch (e) {
        // Ignore localStorage quota errors in private browsing
      }
    }
    return payload
  },

  /**
   * Register a new customer
   */
  async register(userData) {
    const res = await apiClient.post('/auth/register', userData)
    const payload = res?.data || res
    const token = payload?.token || payload?.accessToken
    if (token) {
      setAccessToken(token)
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('stackstorm_token', token)
      } catch (e) {
        // Ignore localStorage quota errors
      }
    }
    return payload
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
