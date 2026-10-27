import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useReservationTimer } from '../hooks/useReservationTimer';
import { ReservationBanner } from '../components/checkout/ReservationBanner';
import { ReservationExpiredModal } from '../components/checkout/ReservationExpiredModal';

describe('STORM-FE-010: Stock Reservation Countdown & Expiration Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('useReservationTimer Hook Unit Logic', () => {
    it('accurately calculates remaining seconds and formats MM:SS from UTC expires_at', () => {
      const now = 1700000000000;
      vi.setSystemTime(now);

      // Target is 14 minutes and 35 seconds in the future
      const targetTime = new Date(now + (14 * 60 + 35) * 1000).toISOString();

      const { result } = renderHook(() =>
        useReservationTimer({ expiresAt: targetTime, totalSeconds: 900 })
      );

      expect(result.current.timeLeft).toBe(875);
      expect(result.current.formattedTime).toBe('14:35');
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isUrgent).toBe(false);
      expect(result.current.isCritical).toBe(false);
    });

    it('counts down each second and triggers onExpire callback when reaching 00:00', () => {
      const now = 1700000000000;
      vi.setSystemTime(now);

      const onExpireMock = vi.fn();
      // Target is 3 seconds in the future
      const targetTime = new Date(now + 3 * 1000).toISOString();

      const { result } = renderHook(() =>
        useReservationTimer({ expiresAt: targetTime, onExpire: onExpireMock })
      );

      expect(result.current.timeLeft).toBe(3);
      expect(result.current.formattedTime).toBe('00:03');
      expect(result.current.isExpired).toBe(false);

      // Advance by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.timeLeft).toBe(2);
      expect(result.current.formattedTime).toBe('00:02');

      // Advance by 2 more seconds -> reaches 0
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.timeLeft).toBe(0);
      expect(result.current.formattedTime).toBe('00:00');
      expect(result.current.isExpired).toBe(true);
      expect(onExpireMock).toHaveBeenCalledTimes(1);
    });

    it('flags isUrgent (<= 180s) and isCritical (<= 60s) thresholds correctly', () => {
      const now = 1700000000000;
      vi.setSystemTime(now);

      // 120 seconds left -> urgent
      const urgentTarget = new Date(now + 120 * 1000).toISOString();
      const { result: urgentResult } = renderHook(() =>
        useReservationTimer({ expiresAt: urgentTarget })
      );
      expect(urgentResult.current.isUrgent).toBe(true);
      expect(urgentResult.current.isCritical).toBe(false);

      // 45 seconds left -> critical
      const criticalTarget = new Date(now + 45 * 1000).toISOString();
      const { result: criticalResult } = renderHook(() =>
        useReservationTimer({ expiresAt: criticalTarget })
      );
      expect(criticalResult.current.isUrgent).toBe(true);
      expect(criticalResult.current.isCritical).toBe(true);
    });

    it('persists and restores expires_at across simulated page reloads via sessionStorage', () => {
      const now = 1700000000000;
      vi.setSystemTime(now);

      const targetTime = new Date(now + 600 * 1000).toISOString();
      // First session sets storage
      renderHook(() => useReservationTimer({ expiresAt: targetTime }));
      expect(sessionStorage.getItem('stackstorm_reservation_expires_at')).toBe(targetTime);

      // Subsequent session without expiresAt parameter picks up from storage
      const { result: reloaded } = renderHook(() => useReservationTimer());
      expect(reloaded.current.timeLeft).toBe(600);
      expect(reloaded.current.formattedTime).toBe('10:00');
    });
  });

  describe('ReservationBanner Visual & Accessible Component', () => {
    it('renders reservation banner with clock and accessible label', () => {
      render(
        <ReservationBanner
          formattedTime="14:59"
          timeLeft={899}
          isUrgent={false}
          isCritical={false}
          percentRemaining={99.8}
        />
      );

      const banner = screen.getByTestId('reservation-banner');
      expect(banner).toBeInTheDocument();
      expect(screen.getByTestId('countdown-clock')).toHaveTextContent('14:59');
      expect(screen.getByText('Stock Held for Checkout')).toBeInTheDocument();
      expect(banner).toHaveClass('reservation-banner--normal');
    });

    it('transitions to critical warning mode when time is critical', () => {
      render(
        <ReservationBanner
          formattedTime="00:45"
          timeLeft={45}
          isUrgent={true}
          isCritical={true}
          percentRemaining={5}
        />
      );

      const banner = screen.getByTestId('reservation-banner');
      expect(banner).toHaveClass('reservation-banner--critical');
      expect(screen.getByText(/High Demand — Ending Soon/i)).toBeInTheDocument();
      expect(screen.getByTestId('countdown-clock')).toHaveTextContent('00:45');
    });
  });

  describe('ReservationExpiredModal Flow', () => {
    it('renders expired modal and triggers onReturnToCart callback when clicked', () => {
      const returnMock = vi.fn();
      render(<ReservationExpiredModal isOpen={true} onReturnToCart={returnMock} />);

      expect(screen.getByTestId('reservation-expired-modal')).toBeInTheDocument();
      expect(screen.getByText('Reservation Expired')).toBeInTheDocument();

      const returnBtn = screen.getByTestId('return-to-cart-btn');
      fireEvent.click(returnBtn);

      expect(returnMock).toHaveBeenCalledTimes(1);
    });

    it('returns null when isOpen is false', () => {
      const { container } = render(<ReservationExpiredModal isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
