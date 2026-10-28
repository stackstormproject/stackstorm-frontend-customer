import { http } from '../lib/http';
import { getGuestOrderToken } from '../lib/session';

const guestHeaders = (orderId) => {
  const token = getGuestOrderToken(orderId);
  return token ? { headers: { 'X-Guest-Token': token } } : {};
};

/** GET /orders/my-orders -> { orders, pagination } (FR009) */
export const listMyOrders = (page = 1) => http.get('/orders/my-orders', { params: { page } });

/** GET /orders/:id - owner only; guests prove ownership with their guest token. */
export const getOrder = (orderId) => http.get(`/orders/${orderId}`, guestHeaders(orderId));

/** GET /orders/:id/track -> { current_status, estimated_delivery, milestones } (FR010) */
export const trackOrder = (orderId) => http.get(`/orders/${orderId}/track`, guestHeaders(orderId));

/**
 * GET /orders/:id/invoice -> the paid order's PDF invoice as a Blob (#177).
 * The server answers 409 while the order is unpaid.
 */
export const getInvoice = (orderId) => {
  const { headers } = guestHeaders(orderId);
  return http.get(`/orders/${orderId}/invoice`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf', ...headers },
  });
};
