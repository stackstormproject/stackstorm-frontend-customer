/**
 * Client-side session state.
 *
 * - The access token lives in memory only. It is never written to localStorage, so a script
 *   injected into the page cannot read a long-lived credential from storage (OWASP A07).
 *   On reload the session is restored from the httpOnly refresh cookie (see AuthContext).
 * - The guest cart token identifies an anonymous cart (backend X-Session-Token, 16-64 chars).
 * - Guest order tokens let a guest view and pay for their own order (backend X-Guest-Token).
 */

const GUEST_CART_KEY = 'dfc.guestCartToken';
const GUEST_ORDERS_KEY = 'dfc.guestOrders';
const SESSION_HINT_KEY = 'dfc.hasSession';
const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

let accessToken = null;
const listeners = new Set();

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token || null;
  listeners.forEach((listener) => listener(accessToken));
};

export const clearAccessToken = () => setAccessToken(null);

/** Subscribe to token changes (login, refresh, logout). Returns an unsubscribe function. */
export const onAccessTokenChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * A non-secret hint that this browser has signed in before. Without it the app skips the
 * session-restore request on load, so first-time visitors do not trigger a 401 every page.
 */
export const hasSessionHint = () => {
  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

export const setSessionHint = (present) => {
  try {
    if (present) window.localStorage.setItem(SESSION_HINT_KEY, '1');
    else window.localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Storage unavailable (private mode): no hint, so the shopper signs in again after reload.
  }
};

const safeStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const randomToken = () => {
  const bytes = new Uint8Array(18);
  window.crypto.getRandomValues(bytes);
  return `guest_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
};

let memoryGuestToken = null;

/** Returns the anonymous cart token, creating and persisting one on first use. */
export const getGuestCartToken = () => {
  const storage = safeStorage();
  const stored = storage?.getItem(GUEST_CART_KEY) || memoryGuestToken;
  if (stored && GUEST_TOKEN_PATTERN.test(stored)) return stored;
  const created = randomToken();
  memoryGuestToken = created;
  storage?.setItem(GUEST_CART_KEY, created);
  return created;
};

/** Forget the guest cart, e.g. after it has been merged into a customer cart. */
export const resetGuestCartToken = () => {
  memoryGuestToken = null;
  safeStorage()?.removeItem(GUEST_CART_KEY);
};

const readGuestOrders = () => {
  try {
    return JSON.parse(safeStorage()?.getItem(GUEST_ORDERS_KEY) || '{}');
  } catch {
    return {};
  }
};

/** Remember the token that proves this browser placed a guest order. */
export const rememberGuestOrder = (orderId, token) => {
  if (!orderId || !token) return;
  const orders = readGuestOrders();
  orders[String(orderId)] = token;
  safeStorage()?.setItem(GUEST_ORDERS_KEY, JSON.stringify(orders));
};

export const getGuestOrderToken = (orderId) => readGuestOrders()[String(orderId)] || null;
