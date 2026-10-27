import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import inventoryApi from '../api/inventory.api';
import apiClient from '../api/client';

describe('inventoryApi Client Gateway Suite', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST /inventory/reserve with payload', async () => {
    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reservation_id: 'res-test-123',
          expires_in: 900,
          expires_at: '2026-10-05T12:00:00.000Z',
        },
      },
    });

    const res = await inventoryApi.reserveStock({ variant_id: 1, quantity: 2 });
    expect(mockPost).toHaveBeenCalledWith('/inventory/reserve', { variant_id: 1, quantity: 2 });
    expect(res.data.reservation_id).toBe('res-test-123');
  });

  it('falls back to /checkout/reserve if /inventory/reserve returns 404', async () => {
    const error404 = { response: { status: 404 } };
    const mockPost = vi
      .spyOn(apiClient, 'post')
      .mockRejectedValueOnce(error404)
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { reservation_id: 'fallback-res-456' },
        },
      });

    const res = await inventoryApi.reserveStock({ variant_id: 2, quantity: 1 });
    expect(mockPost).toHaveBeenNthCalledWith(1, '/inventory/reserve', {
      variant_id: 2,
      quantity: 1,
    });
    expect(mockPost).toHaveBeenNthCalledWith(2, '/checkout/reserve', {
      variant_id: 2,
      quantity: 1,
    });
    expect(res.data.reservation_id).toBe('fallback-res-456');
  });

  it('calls POST /inventory/release/:reservationId', async () => {
    const mockPost = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, message: 'Reservation released successfully' },
    });

    const res = await inventoryApi.releaseStock('res-test-789');
    expect(mockPost).toHaveBeenCalledWith('/inventory/release/res-test-789');
    expect(res.success).toBe(true);
  });

  it('calls GET /inventory/reservation-status', async () => {
    const mockGet = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: { active_reservations: 0, ttl_seconds: 900, status: 'operational' },
      },
    });

    const res = await inventoryApi.getReservationStatus();
    expect(mockGet).toHaveBeenCalledWith('/inventory/reservation-status');
    expect(res.data.status).toBe('operational');
  });
});
