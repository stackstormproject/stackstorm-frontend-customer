import { describe, it, expect, vi, afterEach } from 'vitest';
import checkoutApi from '../api/checkout.api';
import apiClient from '../api/client';

describe('checkoutApi Client Gateway Suite', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST /checkout/initiate with order payload', async () => {
    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          order: { id: 101, order_number: 'DFC-20261005-1234', status: 'pending' },
          subtotal: 5500,
          total: 5950,
        },
      },
    });

    const payload = {
      guestEmail: 'test@example.com',
      items: [{ variant_id: 1, quantity: 1 }],
      shippingAddress: { line1: 'Beach Rd', city: 'Dickwella', postal_code: '81100' },
    };

    const res = await checkoutApi.initiateCheckout(payload);
    expect(mockPost).toHaveBeenCalledWith('/checkout/initiate', payload);
    expect(res.data.order.order_number).toBe('DFC-20261005-1234');
  });

  it('calls POST /checkout/reserve for temporary stock hold', async () => {
    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: { reservation_id: 'res-ck-01', expires_in: 900 } },
    });

    const res = await checkoutApi.reserveStock({ variant_id: 2, quantity: 1 });
    expect(mockPost).toHaveBeenCalledWith('/checkout/reserve', { variant_id: 2, quantity: 1 });
    expect(res.data.reservation_id).toBe('res-ck-01');
  });

  it('calls POST /checkout/confirm/:id upon payment success', async () => {
    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, message: 'Reservation confirmed permanently' },
    });

    const res = await checkoutApi.confirmReservation('res-ck-01');
    expect(mockPost).toHaveBeenCalledWith('/checkout/confirm/res-ck-01');
    expect(res.success).toBe(true);
  });
});
