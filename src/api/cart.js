import { http } from '../lib/http';
import { getAccessToken, getGuestCartToken } from '../lib/session';

/** Guests are identified by X-Session-Token; customers by their bearer token. */
const identity = () =>
  getAccessToken() ? {} : { headers: { 'X-Session-Token': getGuestCartToken() } };

/** GET /cart -> [{ id, variant_id, quantity, unit_price, line_total, available_stock, product }] */
export const getCart = async () => {
  const data = await http.get('/cart', identity());
  return data.items || [];
};

export const addCartItem = (variantId, quantity) =>
  http.post('/cart/items', { variant_id: variantId, quantity }, identity());

export const updateCartItem = (itemId, quantity) =>
  http.patch(`/cart/items/${itemId}`, { quantity }, identity());

export const removeCartItem = (itemId) => http.delete(`/cart/items/${itemId}`, identity());

/** POST /cart/merge - moves the guest cart into the customer cart after login. */
export const mergeGuestCart = (sessionToken) =>
  http.post('/cart/merge', { session_token: sessionToken });
