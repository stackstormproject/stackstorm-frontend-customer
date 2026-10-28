import { http } from '../lib/http';
import { getGuestOrderToken } from '../lib/session';

export const SHIPPING_METHODS = [
  { value: 'standard', label: 'Islandwide delivery', detail: '2-4 working days' },
  { value: 'pickup', label: 'Collect from the Dickwella shop', detail: 'Free, ready next day' },
];

/**
 * POST /checkout/initiate - creates a payment_pending order and a 15-minute stock hold.
 * Prices are computed by the server; the client sends only variant ids and quantities.
 */
export const initiateCheckout = ({ items, shippingAddress, shippingMethod, guestEmail, notes }) =>
  http.post('/checkout/initiate', {
    items: items.map((item) => ({ variant_id: item.variant_id, quantity: item.quantity })),
    shipping_address: shippingAddress,
    shipping_method: shippingMethod,
    guest_email: guestEmail || undefined,
    notes: notes || undefined,
  });

/** POST /checkout/release/:id - gives held stock back when the shopper abandons payment. */
export const releaseReservation = (reservationId) =>
  http.post(`/checkout/release/${encodeURIComponent(reservationId)}`);

const guestHeaders = (orderId) => {
  const token = getGuestOrderToken(orderId);
  return token ? { headers: { 'X-Guest-Token': token } } : {};
};

/** POST /payments/create-intent -> { provider: 'stripe'|'mock', clientSecret, paymentIntentId, amount } */
export const createPaymentIntent = (orderId) =>
  http.post('/payments/create-intent', { order_id: orderId }, guestHeaders(orderId));

/** POST /payments/confirm - the server verifies the intent with Stripe before marking it paid. */
export const confirmPayment = (orderId, paymentIntentId) =>
  http.post(
    '/payments/confirm',
    { order_id: orderId, payment_intent_id: paymentIntentId },
    guestHeaders(orderId)
  );

/**
 * POST /payments/checkout-session -> { provider: 'stripe'|'mock', sessionId, url, amount } (#182).
 * The browser then goes to the hosted payment page (Stripe Checkout, or the test gateway).
 */
export const createCheckoutSession = (orderId) =>
  http.post('/payments/checkout-session', { order_id: orderId }, guestHeaders(orderId));

/** POST /payments/confirm-session - back from the payment page; the server verifies it. */
export const confirmCheckoutSession = (orderId, sessionId) =>
  http.post(
    '/payments/confirm-session',
    { order_id: orderId, session_id: sessionId },
    guestHeaders(orderId)
  );

/**
 * Where to send the shopper for a session. The test gateway is part of this app, so it is
 * opened as a route here whatever host the backend thinks the shop is on.
 */
export const paymentPageFor = (orderId, session) =>
  session.provider === 'mock'
    ? {
        route: `/checkout/test-gateway?${new URLSearchParams({
          order: String(orderId),
          session_id: session.sessionId,
          amount: String(session.amount),
        })}`,
      }
    : { href: session.url };
