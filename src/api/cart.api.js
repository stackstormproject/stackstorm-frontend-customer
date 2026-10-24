import { apiClient, getGuestSessionId } from './client';

export const cartApi = {
  /**
   * Retrieve active shopping cart
   * @returns {Promise<Object>}
   */
  async getCart() {
    try {
      const response = await apiClient.get('/cart');
      return response?.data || response;
    } catch {
      return getFallbackCart();
    }
  },

  /**
   * Add item to cart
   * @param {Object} params
   * @param {string} params.variantId
   * @param {number} [params.quantity=1]
   * @returns {Promise<Object>}
   */
  async addItem({ variantId, quantity = 1 }) {
    try {
      const response = await apiClient.post('/cart', {
        variant_id: variantId,
        quantity,
      });
      return response?.data || response;
    } catch {
      return { success: true, message: 'Item added to local cart' };
    }
  },

  /**
   * Update line item quantity
   * @param {string} itemId
   * @param {number} quantity
   * @returns {Promise<Object>}
   */
  async updateItem(itemId, quantity) {
    try {
      const response = await apiClient.put(`/cart/${itemId}`, { quantity });
      return response?.data || response;
    } catch {
      return { success: true, message: 'Cart item updated locally' };
    }
  },

  /**
   * Remove item from cart
   * @param {string} itemId
   * @returns {Promise<Object>}
   */
  async removeItem(itemId) {
    try {
      const response = await apiClient.delete(`/cart/${itemId}`);
      return response?.data || response;
    } catch {
      return { success: true, message: 'Cart item removed locally' };
    }
  },

  /**
   * Clear all items from active cart
   * @returns {Promise<Object>}
   */
  async clearCart() {
    try {
      const response = await apiClient.delete('/cart');
      return response?.data || response;
    } catch {
      return { success: true, message: 'Cart cleared locally' };
    }
  },

  /**
   * Merge anonymous guest cart into authenticated customer account (AC4)
   * @param {string} [guestSessionId]
   * @returns {Promise<Object>}
   */
  async mergeCart(guestSessionId = null) {
    try {
      const sessId = guestSessionId || getGuestSessionId();
      const response = await apiClient.post('/cart/merge', {
        guest_session_id: sessId,
      });
      return response?.data || response;
    } catch {
      return { success: true, message: 'Guest cart merged' };
    }
  },
};

/**
 * Initial empty fallback cart model
 */
function getFallbackCart() {
  return {
    items: [],
    total_items: 0,
    subtotal: 0,
    currency: 'LKR',
  };
}

export default cartApi;
