import apiClient from './client';

/**
 * Inventory & Stock Reservation API Gateway
 * Communicates with backend Redis TTL-backed stock reservation engine (FR-011, SDS §8.2)
 */
export const inventoryApi = {
  /**
   * Reserves stock for cart/checkout items for 15 minutes.
   * @param {Object} payload
   * @param {string} [payload.order_id]
   * @param {Array<{variant_id: number, quantity: number}>} [payload.items]
   * @param {number} [payload.variant_id]
   * @param {number} [payload.quantity]
   * @returns {Promise<Object>} { reservation_id, order_id, expires_in, expires_at, items }
   */
  reserveStock: async (payload = {}) => {
    try {
      const response = await apiClient.post('/inventory/reserve', payload);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 401) {
        const fallbackResponse = await apiClient.post('/checkout/reserve', payload);
        return fallbackResponse.data;
      }
      throw err;
    }
  },

  /**
   * Releases an active temporary reservation back to available stock.
   * @param {string} reservationId
   * @returns {Promise<Object>}
   */
  releaseStock: async (reservationId) => {
    try {
      const response = await apiClient.post(`/inventory/release/${reservationId}`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 401) {
        const fallbackResponse = await apiClient.post(`/checkout/release/${reservationId}`);
        return fallbackResponse.data;
      }
      throw err;
    }
  },

  /**
   * Retrieves active reservation status probe from backend.
   * @returns {Promise<Object>}
   */
  getReservationStatus: async () => {
    const response = await apiClient.get('/inventory/reservation-status');
    return response.data;
  },
};

export default inventoryApi;
