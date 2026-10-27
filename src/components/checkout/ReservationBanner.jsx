import React from 'react';
import { Clock, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import useReservationTimer from '../../hooks/useReservationTimer';
import './ReservationBanner.css';

/**
 * ReservationBanner Component
 *
 * Prominently displays the 15-minute stock hold countdown during checkout.
 * Transitions through normal (sapphire/gold), amber warning, and critical red modes.
 */
export function ReservationBanner({
  expiresAt,
  formattedTime: customFormattedTime,
  timeLeft: customTimeLeft,
  isUrgent: customIsUrgent,
  isCritical: customIsCritical,
  percentRemaining: customPercent,
  onExpire,
  className = '',
}) {
  // If timer values are not passed directly, use the internal hook
  const hookTimer = useReservationTimer({
    expiresAt,
    onExpire,
  });

  const formattedTime = customFormattedTime ?? hookTimer.formattedTime;
  const timeLeft = customTimeLeft ?? hookTimer.timeLeft;
  const isUrgent = customIsUrgent ?? hookTimer.isUrgent;
  const isCritical = customIsCritical ?? hookTimer.isCritical;
  const percentRemaining = customPercent ?? hookTimer.percentRemaining;

  // Determine state visual theme
  const getBannerStateClass = () => {
    if (isCritical) return 'reservation-banner--critical';
    if (isUrgent) return 'reservation-banner--urgent';
    return 'reservation-banner--normal';
  };

  return (
    <aside
      className={`reservation-banner ${getBannerStateClass()} ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Stock reservation countdown"
      data-testid="reservation-banner"
    >
      <div className="reservation-banner__container">
        <div className="reservation-banner__content">
          <div className="reservation-banner__badge" data-testid="reservation-badge">
            {isCritical ? (
              <Flame
                className="reservation-banner__icon reservation-banner__icon--pulse"
                size={18}
              />
            ) : isUrgent ? (
              <AlertTriangle className="reservation-banner__icon" size={18} />
            ) : (
              <Clock className="reservation-banner__icon" size={18} />
            )}
            <span className="reservation-banner__label">
              {isCritical
                ? 'High Demand — Ending Soon'
                : isUrgent
                  ? 'Stock Hold Expiring'
                  : 'Stock Held for Checkout'}
            </span>
          </div>

          <div className="reservation-banner__message">
            <span className="reservation-banner__text">
              Items reserved for:{' '}
              <strong className="reservation-banner__clock" data-testid="countdown-clock">
                {formattedTime}
              </strong>
            </span>
            <span className="reservation-banner__subtext">
              {isCritical
                ? 'Your selected sizes will release back to public inventory in under 60 seconds.'
                : isUrgent
                  ? 'Complete your order now to guarantee your sizes.'
                  : 'We are holding your apparel exclusively for you while you check out.'}
            </span>
          </div>
        </div>

        <div className="reservation-banner__trust">
          <ShieldCheck size={16} className="reservation-banner__trust-icon" />
          <span>Guaranteed Hold</span>
        </div>
      </div>

      <div
        className="reservation-banner__progress-bar"
        role="progressbar"
        aria-valuenow={Math.round(percentRemaining)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reservation time remaining"
      >
        <div
          className="reservation-banner__progress-fill"
          style={{ width: `${percentRemaining}%` }}
          data-testid="countdown-progress"
        />
      </div>
    </aside>
  );
}

export default ReservationBanner;
