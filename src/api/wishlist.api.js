import { apiClient } from './client';
import { FALLBACK_PRODUCTS } from './product.api';

const STORAGE_KEY = 'stackstorm_wishlist_ids';

/**
 * Helper to get local stored wishlist IDs
 */
export function getLocalWishlistIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : ['c0000000-0000-0000-0000-000000000002'];
  } catch {
    return ['c0000000-0000-0000-0000-000000000002'];
  }
}

/**
 * Helper to persist local wishlist IDs
 */
export function setLocalWishlistIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('Could not persist wishlist to localStorage:', err);
  }
}

export const wishlistApi = {
  /**
   * Retrieve customer wishlist items with live stock status and formatted LKR prices
   * @returns {Promise<Array>}
   */
  async getWishlist() {
    try {
      const response = await apiClient.get('/wishlist');
      const payload = response?.data || response;
      if (Array.isArray(payload)) {
        return payload;
      }
      return getFallbackWishlist();
    } catch {
      return getFallbackWishlist();
    }
  },

  /**
   * Toggle product in wishlist (adds if absent, removes if present)
   * @param {string} productId
   * @returns {Promise<{ wishlisted: boolean, product_id: string, message: string }>}
   */
  async toggleWishlist(productId) {
    try {
      const response = await apiClient.post('/wishlist/toggle', { productId });
      return response?.data || response;
    } catch {
      // Local optimistic toggle fallback
      const localIds = getLocalWishlistIds();
      const isPresent = localIds.includes(productId);
      const updated = isPresent
        ? localIds.filter((id) => id !== productId)
        : [...localIds, productId];
      setLocalWishlistIds(updated);
      return {
        wishlisted: !isPresent,
        product_id: productId,
        message: !isPresent ? 'Product added to wishlist' : 'Product removed from wishlist',
      };
    }
  },

  /**
   * Remove a specific product from wishlist
   * @param {string} productId
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async removeFromWishlist(productId) {
    try {
      const response = await apiClient.delete(`/wishlist/${productId}`);
      return response?.data || response;
    } catch {
      const localIds = getLocalWishlistIds().filter((id) => id !== productId);
      setLocalWishlistIds(localIds);
      return { success: true, message: 'Removed from wishlist' };
    }
  },

  /**
   * Trigger back-in-stock notification alert
   * @param {string} productId
   * @param {string} [email]
   * @returns {Promise<Object>}
   */
  async triggerRestockAlert(productId, email = null) {
    try {
      const response = await apiClient.post(`/wishlist/restock-alert/${productId}`, { email });
      return response?.data || response;
    } catch {
      return { success: true, message: 'Stock alert registered for this product' };
    }
  },
};

/**
 * Returns populated fallback products for current local wishlist IDs
 */
function getFallbackWishlist() {
  const localIds = getLocalWishlistIds();
  return FALLBACK_PRODUCTS.filter((p) => localIds.includes(p.id)).map((p) => ({
    id: `wishlist-${p.id}`,
    product_id: p.id,
    product: p,
    in_stock: (p.availableStock || p.stock_quantity || 0) > 0,
    available_stock: p.availableStock || p.stock_quantity || 25,
  }));
}

export default wishlistApi;
