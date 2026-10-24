import { describe, it, expect, vi, afterEach } from 'vitest';
import paymentApi from '../api/payment.api';
import apiClient from '../api/client';

describe('paymentApi Client Gateway Suite', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST /payments/create-intent with order_id', async () => {
    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          clientSecret: 'pi_test_secret_123',
          paymentIntentId: 'pi_test_123',
          amount: 550000,
          currency: 'lkr',
        },
      },
    });

    const res = await paymentApi.createPaymentIntent(101);
    expect(mockPost).toHaveBeenCalledWith('/payments/create-intent', { order_id: 101 });
    expect(res.data.clientSecret).toBe('pi_test_secret_123');
  });

  it('provides fallback mock clientSecret if backend is unreachable', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Network Error'));

    const res = await paymentApi.createPaymentIntent(102);
    expect(res.success).toBe(true);
    expect(res.data.clientSecret).toMatch(/^pi_mock_/);
  });
});
