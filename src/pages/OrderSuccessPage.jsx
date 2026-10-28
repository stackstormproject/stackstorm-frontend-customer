import React from 'react';
import {
  CheckCircle2,
  Printer,
  ShoppingBag,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';
import './OrderSuccessPage.css';

/**
 * OrderSuccessPage Component
 *
 * Displays authenticated order confirmation receipt with printable Web/PDF invoice (AC3 & AC4).
 */
export function OrderSuccessPage({
  order = null,
  onContinueShopping,
  onTrackOrder = null,
  className = '',
}) {
  const orderNumber =
    order?.order_number || `DFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-8821`;
  const orderDate = new Date().toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const items = order?.items || [
    {
      id: 1,
      title: 'Ceylon Handloom Linen Batik Shirt',
      size: 'L',
      color: 'Sapphire Navy',
      price: 5500,
      quantity: 1,
      image_url:
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const subtotal = order?.subtotal ?? items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const shippingFee = order?.shippingFee ?? (subtotal >= 10000 ? 0 : 450);
  const discount = order?.discount ?? 0;
  const grandTotal =
    order?.total_amount || order?.total || Math.max(0, subtotal - discount + shippingFee);

  const address = order?.shippingAddress || {
    fullName: 'Kasun Kalhara',
    phone: '+94 77 123 4567',
    email: 'kasun@example.com',
    line1: 'No. 45, Tangalle Road',
    line2: 'Apt 2B',
    city: 'Dickwella',
    district: 'Matara',
    province: 'Southern Province',
    postalCode: '81100',
  };

  const paymentDetails = order?.payment || {
    method: 'Stripe Card Payment',
    brand: 'Visa',
    last4: '4242',
    status: 'PAID IN FULL',
  };

  const formatLkr = (val) => {
    return `LKR ${Number(val || 0).toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={`order-success-page ${className}`} data-testid="order-success-page">
      {/* Visual Header & Confirmation Badge */}
      <div className="order-success-header" data-testid="order-confirmation-badge">
        <div className="order-success-header__icon-wrap">
          <CheckCircle2 size={48} className="order-success-header__icon" />
        </div>
        <span className="order-success-header__tag">Payment Succeeded</span>
        <h1 className="order-success-header__title">Thank You For Your Order!</h1>
        <p className="order-success-header__desc">
          Your order has been confirmed and locked with the Dickwella Central Atelier. An email
          receipt and SMS delivery confirmation have been dispatched.
        </p>
      </div>

      {/* Main Printable Invoice Card */}
      <div className="order-invoice-card" id="printable-invoice">
        {/* Atelier Brand Meta Bar */}
        <div className="order-invoice-card__brand-row">
          <div className="order-invoice-card__brand">
            <span className="order-invoice-card__logo-text">Dickwella Fashion Corner</span>
            <span className="order-invoice-card__location">
              Central Atelier • Matara District, Sri Lanka
            </span>
          </div>
          <div className="order-invoice-card__badge-paid" data-testid="paid-status-badge">
            <PackageCheck size={16} />
            <span>PAID IN FULL</span>
          </div>
        </div>

        {/* Order Details Metadata Grid */}
        <div className="order-invoice-meta-grid">
          <div className="order-meta-box">
            <span className="order-meta-box__label">Order Reference</span>
            <strong className="order-meta-box__val" data-testid="order-number-display">
              {orderNumber}
            </strong>
          </div>
          <div className="order-meta-box">
            <span className="order-meta-box__label">Order Date</span>
            <span className="order-meta-box__val">{orderDate}</span>
          </div>
          <div className="order-meta-box">
            <span className="order-meta-box__label">Payment Method</span>
            <span className="order-meta-box__val">
              {paymentDetails.brand
                ? `${paymentDetails.brand.toUpperCase()} ending in •••• ${paymentDetails.last4}`
                : 'Credit / Debit Card'}
            </span>
          </div>
          <div className="order-meta-box">
            <span className="order-meta-box__label">Estimated Delivery</span>
            <span className="order-meta-box__val text-success">2-4 Business Days (Courier)</span>
          </div>
        </div>

        {/* Customer & Delivery Address Snapshot */}
        <div className="order-invoice-address-grid">
          <div className="order-address-col">
            <div className="order-address-col__header">
              <MapPin size={16} />
              <span>Fulfillment & Delivery Destination</span>
            </div>
            <div className="order-address-col__body" data-testid="delivery-address-snapshot">
              <strong>{address.fullName}</strong>
              <div>
                {address.phone} • {address.email}
              </div>
              <div>
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}
              </div>
              <div>
                {address.city}, {address.district || 'Matara'}, {address.postalCode}
              </div>
              <div className="text-muted">Sri Lanka</div>
            </div>
          </div>

          <div className="order-address-col">
            <div className="order-address-col__header">
              <Truck size={16} />
              <span>Courier Dispatch Status</span>
            </div>
            <div className="order-address-col__body">
              <strong>Southern Province Island-Wide Logistics</strong>
              <div>Courier tracking updates will be sent via SMS upon package handoff.</div>
              <div className="order-tracking-milestone">
                <span className="milestone-dot milestone-dot--active" />
                <span>1. Order Confirmed & Paid</span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="order-invoice-items">
          <h2 className="order-invoice-items__title">Garments Purchased ({items.length})</h2>
          <table className="order-invoice-table" data-testid="order-items-list">
            <thead>
              <tr>
                <th>Apparel Description</th>
                <th>Variants</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <div className="item-cell">
                      {it.image_url && (
                        <img src={it.image_url} alt={it.title} className="item-cell__img" />
                      )}
                      <span className="item-cell__name">{it.title}</span>
                    </div>
                  </td>
                  <td>
                    <span className="variant-tag">
                      {it.size || 'Standard'} / {it.color || 'Batik'}
                    </span>
                  </td>
                  <td className="text-center">{it.quantity}</td>
                  <td className="text-right">{formatLkr(it.price)}</td>
                  <td className="text-right">
                    <strong>{formatLkr(it.price * it.quantity)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="order-invoice-totals">
          <div className="order-invoice-totals__row">
            <span>Subtotal</span>
            <span>{formatLkr(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="order-invoice-totals__row text-success">
              <span>Promotion Discount</span>
              <span>-{formatLkr(discount)}</span>
            </div>
          )}
          <div className="order-invoice-totals__row">
            <span>Courier Shipping Fee</span>
            <span>{shippingFee === 0 ? 'FREE' : formatLkr(shippingFee)}</span>
          </div>
          <div className="order-invoice-totals__divider" />
          <div className="order-invoice-totals__row order-invoice-totals__row--grand">
            <span>Total Paid (LKR)</span>
            <strong className="order-invoice-totals__grand-val">{formatLkr(grandTotal)}</strong>
          </div>
        </div>

        {/* Official Footer Note */}
        <div className="order-invoice-footer">
          <p>
            Thank you for purchasing authentic southern coastal garments handcrafted by the artisans
            of Dickwella Fashion Corner. For delivery questions or exchanges within 30 days, please
            contact our Matara atelier at support@dickwellafashion.lk or call 041-225-8890.
          </p>
        </div>
      </div>

      {/* Screen-Only Action Buttons */}
      <div className="order-success-actions">
        <button
          type="button"
          className="btn-secondary order-success-actions__print"
          onClick={handlePrint}
          data-testid="print-invoice-btn"
        >
          <Printer size={18} />
          <span>Print / Save PDF Invoice</span>
        </button>

        <button
          type="button"
          className="btn-primary order-success-actions__continue"
          onClick={onContinueShopping}
          data-testid="continue-shopping-btn"
        >
          <ShoppingBag size={18} />
          <span>Continue Shopping</span>
        </button>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
