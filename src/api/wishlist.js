import { http } from '../lib/http';

/** GET /wishlist - customers only (FR005). */
export const getWishlist = () => http.get('/wishlist');

/** POST /wishlist/toggle -> { wishlisted, productId } */
export const toggleWishlist = (productId) =>
  http.post('/wishlist/toggle', { product_id: productId });
