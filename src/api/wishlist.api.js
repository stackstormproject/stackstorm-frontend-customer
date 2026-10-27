import { apiClient } from './client';
import { FALLBACK_PRODUCTS } from './product.api';

const STORAGE_KEY = 'stackstorm_wishlist_ids';
const STORAGE_ITEMS_KEY = 'stackstorm_wishlist_items';

/**
 * Helper to get local stored wishlist IDs
 */
export function getLocalWishlistIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
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

/**
 * Helper to get cached wishlist item objects
 */
export function getLocalWishlistItems() {
  try {
    const raw = localStorage.getItem(STORAGE_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Helper to persist cached wishlist item objects
 */
export function setLocalWishlistItems(items) {
  try {
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Could not persist wishlist items to localStorage:', err);
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
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : null;

      if (Array.isArray(items)) {
        return items;
      }
      return getFallbackWishlist();
    } catch {
      return getFallbackWishlist();
    }
  },

  /**
   * Toggle product in wishlist (adds if absent, removes if present)
   * @param {string|number} productId
   * @returns {Promise<{ wishlisted: boolean, product_id: string|number, message: string }>}
   */
  async toggleWishlist(productId) {
    try {
      const response = await apiClient.post('/wishlist/toggle', { productId });
      return response?.data || response;
    } catch {
      // Local optimistic toggle fallback
      const localIds = getLocalWishlistIds();
      const isPresent = localIds.some((id) => String(id) === String(productId));
      const updated = isPresent
        ? localIds.filter((id) => String(id) !== String(productId))
        : [...localIds, productId];
      setLocalWishlistIds(updated);

      const cached = getLocalWishlistItems();
      const nextCached = isPresent
        ? cached.filter(
            (it) => String(it.product_id || it.product?.id || it.id) !== String(productId)
          )
        : cached;
      setLocalWishlistItems(nextCached);

      return {
        wishlisted: !isPresent,
        product_id: productId,
        message: !isPresent ? 'Product added to wishlist' : 'Product removed from wishlist',
      };
    }
  },

  /**
   * Remove a specific product from wishlist
   * @param {string|number} productId
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async removeFromWishlist(productId) {
    try {
      const response = await apiClient.delete(`/wishlist/${productId}`);
      return response?.data || response;
    } catch {
      const localIds = getLocalWishlistIds().filter((id) => String(id) !== String(productId));
      setLocalWishlistIds(localIds);

      const cached = getLocalWishlistItems().filter(
        (it) => String(it.product_id || it.product?.id || it.id) !== String(productId)
      );
      setLocalWishlistItems(cached);

      return { success: true, message: 'Removed from wishlist' };
    }
  },

  /**
   * Trigger back-in-stock notification alert
   * @param {string|number} productId
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
export function getFallbackWishlist() {
  const localIds = getLocalWishlistIds();
  const cachedItems = getLocalWishlistItems();
  const result = [];

  localIds.forEach((id) => {
    const fromCached = cachedItems.find(
      (it) => String(it.product_id || it.product?.id || it.id) === String(id)
    );
    if (fromCached) {
      result.push(fromCached);
      return;
    }
    const foundFallback = FALLBACK_PRODUCTS.find((p) => String(p.id) === String(id));
    if (foundFallback) {
      result.push({
        id: `wishlist-${foundFallback.id}`,
        product_id: foundFallback.id,
        product: foundFallback,
        in_stock: (foundFallback.availableStock || foundFallback.stock_quantity || 0) > 0,
        available_stock: foundFallback.availableStock || foundFallback.stock_quantity || 25,
      });
    }
  });

  return result;
}

export default wishlistApi;
