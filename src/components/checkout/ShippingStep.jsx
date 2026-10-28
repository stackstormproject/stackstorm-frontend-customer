import React, { useState } from 'react';
import {
  Truck,
  Zap,
  Store,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import './ShippingStep.css';

export const SHIPPING_METHODS = [
  {
    id: 'standard',
    title: 'Standard Island-Wide Courier',
    description:
      'Delivered to your door via Southern Province courier network (2-4 business days).',
    basePrice: 450,
    icon: Truck,
  },
  {
    id: 'express',
    title: 'Express Priority Courier',
    description: 'Guaranteed expedited delivery within 1-2 business days across Sri Lanka.',
    basePrice: 750,
    icon: Zap,
  },
  {
    id: 'pickup',
    title: 'Dickwella Atelier Store Pickup',
    description: 'Pick up in person at Dickwella Central Beach Road Flagship. Ready in 2 hours.',
    basePrice: 0,
    icon: Store,
  },
];

/**
 * ShippingStep Component
 *
 * Step 2 of Checkout: Selecting delivery method with automatic Free Delivery calculation.
 */
export function ShippingStep({
  subtotal = 0,
  selectedAddress,
  initialShippingMethod = 'standard',
  onBack,
  onSubmitShipping,
  className = '',
}) {
  const isFreeDeliveryQualified = subtotal >= 10000;
  const [shippingMethod, setShippingMethod] = useState(initialShippingMethod);

  const getShippingCost = (method) => {
    if (method.id === 'pickup') return 0;
    if (method.id === 'standard' && isFreeDeliveryQualified) return 0;
    return method.basePrice;
  };

  const handleContinue = () => {
    const chosenMethod =
      SHIPPING_METHODS.find((m) => m.id === shippingMethod) || SHIPPING_METHODS[0];
    const cost = getShippingCost(chosenMethod);
    if (typeof onSubmitShipping === 'function') {
      onSubmitShipping({
        method: chosenMethod.id,
        methodTitle: chosenMethod.title,
        cost,
      });
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'FREE';
    return `LKR ${price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className={`shipping-step ${className}`} data-testid="shipping-step">
      {/* Selected Address Snapshot Card */}
      {selectedAddress && (
        <div className="shipping-step__address-card" data-testid="address-summary-card">
          <div className="shipping-step__address-header">
            <div className="shipping-step__address-title">
              <MapPin size={16} className="shipping-step__pin-icon" />
              <span>Delivering to</span>
            </div>
            <button
              type="button"
              className="shipping-step__edit-btn"
              onClick={onBack}
              data-testid="edit-address-btn"
            >
              Change
            </button>
          </div>
          <div className="shipping-step__address-body">
            <strong>{selectedAddress.fullName}</strong> ({selectedAddress.phone})
            <br />
            {selectedAddress.line1}
            {selectedAddress.line2 && `, ${selectedAddress.line2}`}
            <br />
            {selectedAddress.city}, {selectedAddress.district}, {selectedAddress.postalCode}
          </div>
        </div>
      )}

      <h2 className="shipping-step__heading">Select Shipping Method</h2>
      <p className="shipping-step__subheading">
        Choose your preferred delivery speed and courier carrier across Sri Lanka.
      </p>

      <div className="shipping-step__methods" role="radiogroup" aria-label="Shipping Methods">
        {SHIPPING_METHODS.map((method) => {
          const cost = getShippingCost(method);
          const isSelected = shippingMethod === method.id;
          const Icon = method.icon;

          return (
            <label
              key={method.id}
              className={`shipping-method-card ${isSelected ? 'shipping-method-card--selected' : ''}`}
              data-testid={`shipping-method-${method.id}`}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={method.id}
                checked={isSelected}
                onChange={() => setShippingMethod(method.id)}
                className="shipping-method-card__radio"
              />
              <div className="shipping-method-card__icon-wrap">
                <Icon size={20} />
              </div>
              <div className="shipping-method-card__details">
                <div className="shipping-method-card__top">
                  <span className="shipping-method-card__title">{method.title}</span>
                  <span
                    className={`shipping-method-card__cost ${cost === 0 ? 'shipping-method-card__cost--free' : ''}`}
                    data-testid={`shipping-cost-${method.id}`}
                  >
                    {formatPrice(cost)}
                  </span>
                </div>
                <p className="shipping-method-card__desc">{method.description}</p>
                {method.id === 'standard' && isFreeDeliveryQualified && (
                  <span className="shipping-method-card__unlocked-tag">
                    🎉 Free Shipping Qualified (Order &gt;= LKR 10,000)
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      <div className="shipping-step__actions">
        <button
          type="button"
          className="btn-secondary shipping-step__back-btn"
          onClick={onBack}
          data-testid="back-to-address-btn"
        >
          <ArrowLeft size={16} />
          <span>Back to Address</span>
        </button>

        <button
          type="button"
          className="btn-primary shipping-step__submit-btn"
          onClick={handleContinue}
          data-testid="proceed-to-payment-btn"
        >
          <span>Continue to Payment</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default ShippingStep;
