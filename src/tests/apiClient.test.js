import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient, setAccessToken, getAccessToken, clearAccessToken } from '../api/client';

describe('STORM-FE-002: Centralized Axios API Gateway & Dual JWT Auto-Refresh', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    clearAccessToken();
  });

  afterEach(() => {
    mock.restore();
    clearAccessToken();
  });

  it('AC1 & AC2: should attach Authorization: Bearer <token> to outgoing requests when token is in memory', async () => {
    setAccessToken('jwt-mock-access-token-123');

    mock.onGet('/products').reply((config) => {
      expect(config.headers.Authorization).toBe('Bearer jwt-mock-access-token-123');
      return [
        200,
        {
          success: true,
          data: [{ id: 'prod-1', name: 'Linen Batik Shirt' }],
          message: 'Products retrieved',
          errors: [],
        },
      ];
    });

    const response = await apiClient.get('/products');
    expect(response.success).toBe(true);
    expect(response.data[0].name).toBe('Linen Batik Shirt');
  });

  it('AC2: should not attach Authorization header when access token is null (guest mode)', async () => {
    clearAccessToken();

    mock.onGet('/products').reply((config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return [
        200,
        {
          success: true,
          data: [],
          message: 'Guest products view',
          errors: [],
        },
      ];
    });

    const response = await apiClient.get('/products');
    expect(response.success).toBe(true);
    expect(response.data).toEqual([]);
  });

  it('AC3: should unwrap standardized JSON:API envelope directly to response data', async () => {
    mock.onGet('/categories').reply(200, {
      success: true,
      data: [{ id: 'cat-1', name: "Men's Batik" }],
      message: 'Categories fetched',
      errors: [],
    });

    const result = await apiClient.get('/categories');
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data');
    expect(result.data[0].name).toBe("Men's Batik");
  });

  it('AC3: should intercept 401 Unauthorized, refresh token via POST /auth/refresh-token, and retry original request', async () => {
    setAccessToken('expired-access-token');

    let attemptCount = 0;

    // First attempt returns 401, second attempt returns 200 after refresh
    mock.onGet('/users/profile').reply((config) => {
      attemptCount += 1;
      if (attemptCount === 1) {
        return [401, { success: false, message: 'jwt expired', errors: [] }];
      }
      expect(config.headers.Authorization).toBe('Bearer new-refreshed-jwt-token');
      return [
        200,
        {
          success: true,
          data: { id: 'usr-1', email: 'customer@dickwella.lk', role: 'customer' },
          message: 'Profile retrieved',
          errors: [],
        },
      ];
    });

    // Mock refresh endpoint returning new access token
    mock.onPost('/auth/refresh-token').reply(200, {
      success: true,
      data: { token: 'new-refreshed-jwt-token' },
      message: 'Token refreshed successfully',
      errors: [],
    });

    const result = await apiClient.get('/users/profile');

    expect(attemptCount).toBe(2);
    expect(result.success).toBe(true);
    expect(result.data.email).toBe('customer@dickwella.lk');
    expect(getAccessToken()).toBe('new-refreshed-jwt-token');
  });

  it('AC4: should queue concurrent 401 requests so that exactly ONE refresh request is dispatched', async () => {
    setAccessToken('expired-token');

    let refreshCallCount = 0;
    let ordersCallCount = 0;
    let wishlistCallCount = 0;

    mock.onPost('/auth/refresh-token').reply(() => {
      refreshCallCount += 1;
      return [
        200,
        {
          success: true,
          data: { token: 'singleton-refreshed-token' },
          message: 'Refreshed',
          errors: [],
        },
      ];
    });

    mock.onGet('/orders').reply(() => {
      ordersCallCount += 1;
      if (ordersCallCount === 1) {
        return [401, { success: false, message: 'jwt expired' }];
      }
      return [200, { success: true, data: ['order-1', 'order-2'] }];
    });

    mock.onGet('/wishlist').reply(() => {
      wishlistCallCount += 1;
      if (wishlistCallCount === 1) {
        return [401, { success: false, message: 'jwt expired' }];
      }
      return [200, { success: true, data: ['item-1'] }];
    });

    // Fire two concurrent requests while token is expired
    const [ordersRes, wishlistRes] = await Promise.all([
      apiClient.get('/orders'),
      apiClient.get('/wishlist'),
    ]);

    // Exactly ONE refresh token request dispatched to backend
    expect(refreshCallCount).toBe(1);
    expect(ordersRes.success).toBe(true);
    expect(wishlistRes.success).toBe(true);
    expect(getAccessToken()).toBe('singleton-refreshed-token');
  });

  it('AC5: should prevent infinite 401 loop if refresh endpoint itself fails', async () => {
    setAccessToken('invalid-token');

    // Mock refresh endpoint failing with 401
    mock.onPost('/auth/refresh-token').reply(401, {
      success: false,
      message: 'Invalid refresh token',
      errors: [],
    });

    mock.onGet('/cart').reply(401, {
      success: false,
      message: 'Token expired',
      errors: [],
    });

    await expect(apiClient.get('/cart')).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
  });

  it('AC6: should reject with standardized error message on 400 Bad Request', async () => {
    mock.onPost('/checkout').reply(400, {
      success: false,
      message: 'Available stock exceeded for variant d0000000-0000-0000-0000-000000000001',
      errors: [{ field: 'quantity', message: 'Insufficient inventory' }],
    });

    try {
      await apiClient.post('/checkout', { items: [] });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).toContain('Available stock exceeded');
      expect(err.status).toBe(400);
      expect(err.errors[0].field).toBe('quantity');
    }
  });

  it('AC7: should NOT trigger refresh token rotation when /auth/login returns 401', async () => {
    let refreshTriggered = false;
    mock.onPost('/auth/refresh-token').reply(() => {
      refreshTriggered = true;
      return [200, { success: true, data: { token: 'bad-token' } }];
    });

    mock.onPost('/auth/login').reply(401, {
      success: false,
      message: 'Email or password is incorrect.',
      errors: [],
    });

    try {
      await apiClient.post('/auth/login', { email: 'alice@example.com', password: 'wrong' });
      expect.fail('Should reject on invalid credentials');
    } catch (err) {
      expect(err.status).toBe(401);
      expect(err.message).toBe('Email or password is incorrect.');
      expect(refreshTriggered).toBe(false);
    }
  });

  it('AC8: should sync in-memory token to null when localStorage is emptied externally', () => {
    setAccessToken('temporary-token');
    expect(getAccessToken()).toBe('temporary-token');

    // Simulate user clearing Application storage in DevTools
    localStorage.clear();
    expect(getAccessToken()).toBeNull();
  });
});
