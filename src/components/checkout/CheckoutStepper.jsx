import React from 'react';
import { Check, MapPin, Truck, CreditCard } from 'lucide-react';
import './CheckoutStepper.css';

export const CHECKOUT_STEPS = [
  { id: 1, label: 'Delivery Details', icon: MapPin },
  { id: 2, label: 'Shipping & Review', icon: Truck },
  { id: 3, label: 'Payment', icon: CreditCard },
];

/**
 * CheckoutStepper Component
 *
 * Renders the 3-stage checkout progress bar (AC1).
 */
export function CheckoutStepper({ currentStep = 1, onStepClick = null, className = '' }) {
  return (
    <nav
      className={`checkout-stepper ${className}`}
      aria-label="Checkout Progress"
      data-testid="checkout-stepper"
    >
      <ol className="checkout-stepper__list">
        {CHECKOUT_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isClickable = onStepClick && currentStep > step.id;
          const StepIcon = step.icon;

          return (
            <li
              key={step.id}
              className={`checkout-stepper__item ${
                isActive
                  ? 'checkout-stepper__item--active'
                  : isCompleted
                    ? 'checkout-stepper__item--completed'
                    : 'checkout-stepper__item--upcoming'
              }`}
              data-testid={`step-indicator-${step.id}`}
            >
              <button
                type="button"
                className="checkout-stepper__button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.id)}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="checkout-stepper__indicator">
                  {isCompleted ? (
                    <Check size={16} className="checkout-stepper__check-icon" />
                  ) : (
                    <span className="checkout-stepper__number">{step.id}</span>
                  )}
                </span>
                <span className="checkout-stepper__label">
                  <span className="checkout-stepper__step-prefix">Step {step.id}:</span>
                  <span className="checkout-stepper__title">{step.label}</span>
                </span>
              </button>

              {index < CHECKOUT_STEPS.length - 1 && (
                <div
                  className={`checkout-stepper__connector ${
                    currentStep > step.id ? 'checkout-stepper__connector--completed' : ''
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default CheckoutStepper;
