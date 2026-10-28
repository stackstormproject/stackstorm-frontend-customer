import apiClient from './client';

/**
 * Checkout API Service Gateway
 * Handles order initiation, stock reservation, and payment coordination (FR-013, SDS §9.1)
 */
export const checkoutApi = {
  /**
   * Initiates checkout for guest or authenticated customer.
   * Creates an order with pending status and locks temporary stock reservation.
   *
   * @param {Object} payload
   * @param {string} [payload.guestEmail]
   * @param {string} [payload.guestPhone]
   * @param {Array<{variant_id: number, quantity: number}>} payload.items
   * @param {Object} payload.shippingAddress
   * @param {string} [payload.shippingMethod]
   * @returns {Promise<Object>}
   */
  initiateCheckout: async (payload) => {
    const response = await apiClient.post('/checkout/initiate', payload);
    return response.data;
  },

  /**
   * Reserves checkout variant inventory for 15 minutes.
   */
  reserveStock: async (payload) => {
    const response = await apiClient.post('/checkout/reserve', payload);
    return response.data;
  },

  /**
   * Releases temporary reservation held under reservationId
   */
  releaseReservation: async (reservationId) => {
    const response = await apiClient.post(`/checkout/release/${reservationId}`);
    return response.data;
  },

  /**
   * Permanently confirms reserved stock upon successful payment
   */
  confirmReservation: async (reservationId) => {
    const response = await apiClient.post(`/checkout/confirm/${reservationId}`);
    return response.data;
  },
};

export default checkoutApi;
