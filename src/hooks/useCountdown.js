import { useEffect, useRef, useState } from 'react';

const TICK_MS = 1000;

/** Seconds left until `expiresAt` (ms epoch); calls onExpire once when it reaches zero. */
export function useCountdown(expiresAt, onExpire) {
  const secondsUntil = () =>
    expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : 0;
  const [seconds, setSeconds] = useState(secondsUntil);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!expiresAt) return undefined;
    let fired = false;
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0 && !fired) {
        fired = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [expiresAt]);

  return seconds;
}
