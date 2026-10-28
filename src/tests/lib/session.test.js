import {
  getGuestCartToken,
  resetGuestCartToken,
  rememberGuestOrder,
  getGuestOrderToken,
  onAccessTokenChange,
  setAccessToken,
} from '../../lib/session';

describe('session', () => {
  beforeEach(() => {
    localStorage.clear();
    resetGuestCartToken();
  });

  it('should create a guest cart token the backend accepts and reuse it', () => {
    const token = getGuestCartToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    expect(getGuestCartToken()).toBe(token);
  });

  it('should replace a stored token the backend would reject', () => {
    localStorage.setItem('dfc.guestCartToken', 'short');

    expect(getGuestCartToken()).not.toBe('short');
  });

  it('should issue a new token after reset', () => {
    const first = getGuestCartToken();
    resetGuestCartToken();

    expect(getGuestCartToken()).not.toBe(first);
  });

  it('should remember guest order tokens per order', () => {
    rememberGuestOrder(12, 'tok12');
    rememberGuestOrder(null, 'ignored');

    expect(getGuestOrderToken(12)).toBe('tok12');
    expect(getGuestOrderToken(13)).toBeNull();
  });

  it('should survive corrupt guest order storage', () => {
    localStorage.setItem('dfc.guestOrders', '{not json');

    expect(getGuestOrderToken(1)).toBeNull();
  });

  it('should notify subscribers of token changes', () => {
    const seen = [];
    const off = onAccessTokenChange((t) => seen.push(t));

    setAccessToken('x');
    off();
    setAccessToken(null);

    expect(seen).toEqual(['x']);
  });

  it('should never write the access token to storage', () => {
    setAccessToken('secret-token');

    expect(JSON.stringify({ ...localStorage })).not.toContain('secret-token');
    setAccessToken(null);
  });
});
