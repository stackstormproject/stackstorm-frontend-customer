import React from 'react';
import { Truck, CheckCircle2, Sparkles } from 'lucide-react';
import './FreeShippingMeter.css';

export const FREE_SHIPPING_THRESHOLD = 10000; // LKR 10,000.00 standard across StackStorm

/**
 * FreeShippingMeter Component
 *
 * Visually displays progress towards qualifying for Free Island-Wide Delivery (AC3).
 * Threshold: LKR 10,000.00
 */
export function FreeShippingMeter({ subtotal = 0, className = '' }) {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - safeSubtotal);
  const percent = Math.min(100, Math.round((safeSubtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const isQualified = safeSubtotal >= FREE_SHIPPING_THRESHOLD;

  const formatCurrency = (val) => {
    return `LKR ${val.toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div
      className={`free-shipping-meter ${isQualified ? 'free-shipping-meter--unlocked' : ''} ${className}`}
      data-testid="free-shipping-meter"
    >
      <div className="free-shipping-meter__header">
        <div className="free-shipping-meter__icon-wrap">
          {isQualified ? (
            <CheckCircle2
              size={18}
              className="free-shipping-meter__icon free-shipping-meter__icon--success"
            />
          ) : (
            <Truck size={18} className="free-shipping-meter__icon" />
          )}
        </div>
        <p className="free-shipping-meter__text" data-testid="free-shipping-message">
          {isQualified ? (
            <span>
              <strong>Congratulations!</strong> You have unlocked <strong>FREE Delivery</strong>{' '}
              across Sri Lanka!
            </span>
          ) : (
            <span>
              Add <strong data-testid="free-shipping-remaining">{formatCurrency(remaining)}</strong>{' '}
              more to qualify for <strong>FREE Delivery!</strong>
            </span>
          )}
        </p>
        {isQualified && <Sparkles size={16} className="free-shipping-meter__sparkle" />}
      </div>

      <div
        className="free-shipping-meter__track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Free shipping progress"
      >
        <div
          className="free-shipping-meter__fill"
          style={{ width: `${percent}%` }}
          data-testid="free-shipping-progress"
        />
      </div>

      <div className="free-shipping-meter__footer">
        <span>LKR 0.00</span>
        <span className="free-shipping-meter__target">Free Delivery at LKR 10,000.00</span>
      </div>
    </div>
  );
}

export default FreeShippingMeter;
