import { http, refreshAccessToken } from '../lib/http';
import { setAccessToken, clearAccessToken, hasSessionHint, setSessionHint } from '../lib/session';

/** POST /auth/register (FR035). Returns the public customer; stores the access token. */
export const register = async ({ name, email, password, phone }) => {
  const data = await http.post('/auth/register', { name, email, password, phone: phone || null });
  setAccessToken(data.accessToken);
  setSessionHint(true);
  return data.customer;
};

/** POST /auth/login (FR035). The refresh token arrives as an httpOnly cookie. */
export const login = async ({ email, password }) => {
  const data = await http.post('/auth/login', { email, password });
  setAccessToken(data.accessToken);
  setSessionHint(true);
  return data.customer;
};

/** Restores a session from the refresh cookie after a page reload. */
export const restoreSession = async () => {
  if (!hasSessionHint()) return null;
  try {
    const data = await refreshAccessToken();
    return data.customer || null;
  } catch (error) {
    setSessionHint(false);
    throw error;
  }
};

/** POST /auth/logout - revokes the refresh token server-side, then forgets the access token. */
export const logout = async () => {
  try {
    await http.post('/auth/logout');
  } finally {
    clearAccessToken();
    setSessionHint(false);
  }
};

/**
 * POST /auth/forgot-password (#185). Always succeeds for a valid email. Outside production,
 * without a mail server, the backend also returns the link as `dev_reset_url`.
 */
export const requestPasswordReset = (email) => http.post('/auth/forgot-password', { email });

/** POST /auth/reset-password (#185): new password from the emailed link's token. */
export const resetPassword = ({ token, password }) =>
  http.post('/auth/reset-password', { token, password });
