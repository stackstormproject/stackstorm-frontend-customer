import React from 'react';
import { Check, Clock, Package, Truck, Home, AlertCircle, Sparkles } from 'lucide-react';
import './DeliveryMilestoneStepper.css';

// 4 Canonical Stages (SDS §10.2)
const STAGES = [
  { id: 'placed', label: 'Order Placed', icon: Clock, desc: 'Confirmed & stock locked' },
  {
    id: 'processing',
    label: 'Artisan Tailoring',
    icon: Package,
    desc: 'Boutique inspection & packing',
  },
  { id: 'shipped', label: 'Dispatched', icon: Truck, desc: 'In transit with Southern Express' },
  { id: 'delivered', label: 'Delivered', icon: Home, desc: 'Signed & safely delivered' },
];

/**
 * Calculates estimated delivery date: 3 business days from order placement date (AC4).
 */
export function calculateEstimatedDelivery(orderDate) {
  const date = orderDate ? new Date(orderDate) : new Date();
  let daysToAdd = 3;
  while (daysToAdd > 0) {
    date.setDate(date.getDate() + 1);
    // Skip Sunday (0) and Saturday (6) for Sri Lankan courier business days
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      daysToAdd--;
    }
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * DeliveryMilestoneStepper Component
 *
 * Visual 4-stage delivery timeline with real-time status updates (AC3).
 * Normalizes status strings (.toLowerCase()) to prevent casing mismatch bugs per Failure Recovery Matrix.
 */
export function DeliveryMilestoneStepper({
  status = 'placed',
  orderDate,
  estimatedDelivery,
  carrier = 'Southern Province Express Logistics',
  trackingNumber = 'SP-EXP-81100-984',
  milestones = [],
  className = '',
}) {
  // Defensive casing normalization per Failure Recovery Matrix (e.g. 'SHIPPED' -> 'shipped')
  const normalizedStatus = (status || 'placed').toLowerCase().trim();

  // Determine current active step index (0 to 3)
  const statusIndexMap = {
    pending: 0,
    placed: 0,
    processing: 1,
    in_production: 1,
    shipped: 2,
    in_transit: 2,
    out_for_delivery: 2,
    delivered: 3,
    completed: 3,
  };

  const currentStepIndex = statusIndexMap[normalizedStatus] ?? 0;
  const estDateText = estimatedDelivery
    ? new Date(estimatedDelivery).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : calculateEstimatedDelivery(orderDate);

  return (
    <div
      className={`delivery-milestone-stepper ${className}`}
      data-testid="delivery-milestone-stepper"
    >
      {/* Estimated Delivery Header (AC4) */}
      <div className="stepper-header">
        <div className="stepper-header__info">
          <span className="stepper-header__label">Estimated Islandwide Delivery</span>
          <h4 className="stepper-header__date" data-testid="estimated-delivery-date">
            {estDateText}
          </h4>
        </div>

        {trackingNumber && (
          <div className="stepper-header__tracking">
            <span className="tracking-label">Carrier & Tracking:</span>
            <span className="tracking-number" data-testid="tracking-number-text">
              {carrier} • <strong>{trackingNumber}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 4-Stage Stepper Progress Bar (AC3) */}
      <div className="stepper-track-wrap" role="region" aria-label="Delivery progress timeline">
        <div className="stepper-progress-line">
          <div
            className="stepper-progress-fill"
            style={{ width: `${(currentStepIndex / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        <div className="stepper-steps-grid">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isFuture = idx > currentStepIndex;

            let statusClass = 'stepper-step--future';
            if (isCompleted) statusClass = 'stepper-step--completed';
            if (isCurrent) statusClass = 'stepper-step--current';

            return (
              <div
                key={stage.id}
                className={`stepper-step ${statusClass}`}
                data-testid={`milestone-step-${stage.id}`}
              >
                <div className="stepper-step__node" data-testid={`node-${stage.id}`}>
                  {isCompleted ? (
                    <Check size={14} className="node-icon-check" />
                  ) : (
                    <Icon size={14} className="node-icon" />
                  )}
                  {isCurrent && <span className="pulse-glow-ring" />}
                </div>

                <div className="stepper-step__content">
                  <span className="stepper-step__title">{stage.label}</span>
                  <span className="stepper-step__desc">{stage.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DeliveryMilestoneStepper;
