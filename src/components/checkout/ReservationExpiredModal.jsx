import React, { useEffect } from 'react';
import { AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import './ReservationExpiredModal.css';

/**
 * ReservationExpiredModal Component
 *
 * Informs customer that the 15-minute temporary hold has lapsed and stock
 * has been released back to public inventory (FR-011, SDS §8.2).
 */
export function ReservationExpiredModal({ isOpen = true, onReturnToCart, onBrowseProducts }) {
  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReturnToCart = () => {
    if (typeof onReturnToCart === 'function') {
      onReturnToCart();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/cart';
    }
  };

  const handleBrowseProducts = () => {
    if (typeof onBrowseProducts === 'function') {
      onBrowseProducts();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/products';
    }
  };

  return (
    <div
      className="reservation-expired-overlay"
      role="presentation"
      data-testid="reservation-expired-overlay"
    >
      <div
        className="reservation-expired-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-expired-title"
        aria-describedby="reservation-expired-desc"
        data-testid="reservation-expired-modal"
      >
        <div className="reservation-expired-modal__icon-wrap">
          <AlertCircle size={36} className="reservation-expired-modal__icon" />
        </div>

        <h2 id="reservation-expired-title" className="reservation-expired-modal__title">
          Reservation Expired
        </h2>

        <p id="reservation-expired-desc" className="reservation-expired-modal__description">
          Your 15-minute temporary stock reservation window has expired. The apparel items held for
          your checkout session have been automatically released back to our inventory.
        </p>

        <div className="reservation-expired-modal__notice">
          <span>
            Items may still be available if other shoppers have not purchased them. Please review
            your cart to re-verify availability.
          </span>
        </div>

        <div className="reservation-expired-modal__actions">
          <button
            type="button"
            className="btn btn--primary reservation-expired-modal__btn-primary"
            onClick={handleReturnToCart}
            data-testid="return-to-cart-btn"
          >
            <ShoppingBag size={18} />
            <span>Return to Cart</span>
          </button>

          <button
            type="button"
            className="btn btn--secondary reservation-expired-modal__btn-secondary"
            onClick={handleBrowseProducts}
            data-testid="browse-products-btn"
          >
            <span>Browse Products</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReservationExpiredModal;
