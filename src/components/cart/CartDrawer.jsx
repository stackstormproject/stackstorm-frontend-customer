import React, { useState } from 'react';
import { X, ShoppingBag, ArrowRight, Truck, ShieldCheck, Tag, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { CartItemRow } from './CartItemRow';
import { formatLKR } from '../../utils/formatters';
import './CartDrawer.css';

/**
 * CartDrawer Component (STORM-FE-009)
 * Implements FR-010 Shopping Cart Drawer & SDS §8.1 Cart API.
 * Animated right slide-over with backdrop blur, item steppers, islandwide delivery bar,
 * promo code discount calculator, and checkout trigger.
 */
export function CartDrawer({
  isOpen: propIsOpen,
  onClose: propOnClose,
  items: propItems,
  onUpdateQuantity: propOnUpdateQuantity,
  onRemoveItem: propOnRemoveItem,
  onCheckout: propOnCheckout,
}) {
  let cart = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    cart = useCart();
  } catch {
    // Graceful fallback for standalone unit testing without CartProvider
  }

  const isOpen = propIsOpen !== undefined ? propIsOpen : cart?.isOpen || false;
  const handleClose = propOnClose || cart?.closeCart;
  const items = propItems || cart?.items || [];
  const handleUpdateQty = propOnUpdateQuantity || cart?.updateQuantity;
  const handleRemove = propOnRemoveItem || cart?.removeItem;

  const totalItems = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const subtotal = items.reduce((sum, it) => sum + it.unit_price * (it.quantity || 1), 0);
  const discountRate = cart?.promoDiscountRate || 0;
  const discountAmount = Math.round(subtotal * discountRate);
  const discountedSubtotal = subtotal - discountAmount;
  const isFreeShipping = discountedSubtotal >= 10000 || discountedSubtotal === 0;
  const shippingFee = isFreeShipping ? 0 : 450;
  const total = discountedSubtotal + shippingFee;
  const amountToFreeShipping = Math.max(0, 10000 - discountedSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((discountedSubtotal / 10000) * 100));

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (cart?.applyPromoCode) {
      const res = cart.applyPromoCode(couponInput);
      setCouponMsg(res.message);
    }
  };

  return (
    <>
      {/* 1. Backdrop overlay with blur */}
      <div
        className={`cart-drawer__backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={handleClose}
        data-testid="cart-backdrop"
        aria-hidden={!isOpen}
      />

      {/* 2. Slide-over panel */}
      <aside
        className={`cart-drawer__panel ${isOpen ? 'is-open' : ''}`}
        data-testid="cart-drawer-panel"
        aria-label="Shopping Cart Drawer"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="cart-drawer__header">
          <div className="cart-drawer__title-wrap">
            <ShoppingBag size={20} color="#D4AF37" />
            <h3 className="cart-drawer__title">Shopping Bag</h3>
            <span className="cart-drawer__count-badge" data-testid="cart-drawer-item-count">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>

          <button
            type="button"
            className="cart-drawer__close-btn"
            onClick={handleClose}
            aria-label="Close cart drawer"
            data-testid="cart-drawer-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {items.length > 0 && (
          <div className="cart-drawer__shipping-bar">
            <div className="cart-drawer__shipping-text">
              <span>
                <Truck size={13} style={{ display: 'inline', marginRight: 4 }} />
                {isFreeShipping
                  ? 'Unlocked: Free Islandwide Delivery!'
                  : `Add ${formatLKR(amountToFreeShipping)} more for Free Shipping`}
              </span>
              <span>{freeShippingProgress}%</span>
            </div>
            <div className="cart-drawer__progress-track">
              <div
                className="cart-drawer__progress-fill"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items List or Empty State */}
        <div className="cart-drawer__items-list" data-testid="cart-drawer-items-list">
          {items.length === 0 ? (
            <div className="cart-drawer__empty" data-testid="cart-drawer-empty">
              <div className="cart-drawer__empty-icon">
                <ShoppingBag size={28} />
              </div>
              <h4 className="cart-drawer__empty-title">Your Cart is Empty</h4>
              <p className="cart-drawer__empty-desc">
                Looks like you haven't added any authentic Sri Lankan batik or handloom garments
                yet.
              </p>
              <button
                type="button"
                className="cart-drawer__btn-shop"
                onClick={handleClose}
                data-testid="cart-drawer-continue-shop"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQty}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>

        {/* Footer Order Summary */}
        {items.length > 0 && (
          <div className="cart-drawer__footer">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} className="cart-drawer__promo-box">
              <input
                type="text"
                className="cart-drawer__promo-input"
                placeholder="PROMO CODE (e.g. BATIK20)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                data-testid="cart-promo-input"
              />
              <button
                type="submit"
                className="cart-drawer__promo-btn"
                data-testid="cart-promo-apply-btn"
              >
                Apply
              </button>
            </form>
            {couponMsg && (
              <div
                style={{ fontSize: '0.75rem', color: discountAmount > 0 ? '#10B981' : '#EF4444' }}
              >
                {couponMsg}
              </div>
            )}

            {/* Price Calculations */}
            <div className="cart-drawer__summary-rows">
              <div className="cart-drawer__summary-row">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">{formatLKR(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="cart-drawer__summary-row" style={{ color: '#10B981' }}>
                  <span>Discount ({Math.round(discountRate * 100)}%)</span>
                  <span>-{formatLKR(discountAmount)}</span>
                </div>
              )}

              <div className="cart-drawer__summary-row">
                <span>Islandwide Delivery</span>
                <span data-testid="cart-shipping">
                  {isFreeShipping ? 'FREE' : formatLKR(shippingFee)}
                </span>
              </div>

              <div className="cart-drawer__summary-row cart-drawer__summary-row--total">
                <span>Estimated Total</span>
                <span data-testid="cart-total">{formatLKR(total)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              type="button"
              className="cart-drawer__checkout-btn"
              onClick={() => {
                if (typeof handleClose === 'function') {
                  handleClose();
                }
                if (typeof propOnCheckout === 'function') {
                  propOnCheckout();
                }
              }}
              data-testid="cart-checkout-btn"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: '0.7rem',
                color: 'var(--color-text-subtle)',
              }}
            >
              <ShieldCheck size={13} color="#D4AF37" />
              <span>15-Minute Temporary Stock Lock Guaranteed</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default CartDrawer;
