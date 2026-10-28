import { useState, useEffect, useRef, useCallback } from 'react';

const SESSION_STORAGE_KEY = 'stackstorm_reservation_expires_at';
const DEFAULT_TOTAL_SECONDS = 900; // 15 minutes

/**
 * useReservationTimer Hook
 *
 * Accurately tracks temporary stock reservation countdown against absolute UTC expires_at.
 * Prevents client-side clock skew drift and preserves state across page refreshes.
 *
 * @param {Object} options
 * @param {string|Date} [options.expiresAt] - Server-provided ISO UTC expiry timestamp
 * @param {number} [options.totalSeconds=900] - Total reservation window for percentage calculations
 * @param {Function} [options.onExpire] - Callback invoked precisely when the countdown reaches 00:00
 * @param {boolean} [options.autoSyncSession=true] - Persist expiry timestamp in sessionStorage
 */
export function useReservationTimer({
  expiresAt: initialExpiresAt = null,
  totalSeconds = DEFAULT_TOTAL_SECONDS,
  onExpire = null,
  autoSyncSession = true,
} = {}) {
  // 1. Resolve initial target expiration timestamp
  const resolveTargetTime = useCallback(() => {
    if (initialExpiresAt) {
      const parsed = new Date(initialExpiresAt).getTime();
      if (!isNaN(parsed) && autoSyncSession && typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, new Date(initialExpiresAt).toISOString());
      }
      return !isNaN(parsed) ? parsed : null;
    }

    if (autoSyncSession && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (cached) {
        const parsed = new Date(cached).getTime();
        return !isNaN(parsed) ? parsed : null;
      }
    }

    return null;
  }, [initialExpiresAt, autoSyncSession]);

  const [targetTimestamp, setTargetTimestamp] = useState(resolveTargetTime);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // 2. Compute delta against current time
  const calculateSecondsLeft = useCallback((target) => {
    if (!target) return 0;
    const now = Date.now();
    const diff = Math.floor((target - now) / 1000);
    return Math.max(0, diff);
  }, []);

  const [timeLeft, setTimeLeft] = useState(() => calculateSecondsLeft(targetTimestamp));
  const [isExpired, setIsExpired] = useState(() => {
    if (!targetTimestamp) return false;
    return calculateSecondsLeft(targetTimestamp) <= 0;
  });

  // Keep target in sync if prop changes
  useEffect(() => {
    const resolved = resolveTargetTime();
    setTargetTimestamp(resolved);
    const initialSeconds = calculateSecondsLeft(resolved);
    setTimeLeft(initialSeconds);
    setIsExpired(resolved ? initialSeconds <= 0 : false);
  }, [initialExpiresAt, resolveTargetTime, calculateSecondsLeft]);

  // 3. Heartbeat ticker (1-second tick)
  useEffect(() => {
    if (!targetTimestamp) return;

    const tick = () => {
      const remaining = calculateSecondsLeft(targetTimestamp);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        if (autoSyncSession && typeof window !== 'undefined') {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
        if (typeof onExpireRef.current === 'function') {
          onExpireRef.current();
        }
      }
    };

    // Run immediate tick to avoid 1-second lag
    tick();

    if (calculateSecondsLeft(targetTimestamp) <= 0) {
      return;
    }

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [targetTimestamp, calculateSecondsLeft, autoSyncSession]);

  // 4. Formatter helper (MM:SS)
  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 5. Public controller actions
  const startTimer = useCallback(
    (newExpiresAt) => {
      const parsed = new Date(newExpiresAt).getTime();
      if (!isNaN(parsed)) {
        if (autoSyncSession && typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_STORAGE_KEY, new Date(newExpiresAt).toISOString());
        }
        setTargetTimestamp(parsed);
        const remaining = Math.max(0, Math.floor((parsed - Date.now()) / 1000));
        setTimeLeft(remaining);
        setIsExpired(remaining <= 0);
      }
    },
    [autoSyncSession]
  );

  const clearTimer = useCallback(() => {
    setTargetTimestamp(null);
    setTimeLeft(0);
    setIsExpired(false);
    if (autoSyncSession && typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [autoSyncSession]);

  const isUrgent = timeLeft > 0 && timeLeft <= 180; // 3 minutes warning
  const isCritical = timeLeft > 0 && timeLeft <= 60; // 1 minute warning
  const percentRemaining =
    totalSeconds > 0 ? Math.min(100, Math.max(0, (timeLeft / totalSeconds) * 100)) : 0;

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isExpired,
    isUrgent,
    isCritical,
    percentRemaining,
    startTimer,
    clearTimer,
    targetTimestamp,
  };
}

export default useReservationTimer;
