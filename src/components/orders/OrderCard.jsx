import React, { useState } from 'react';
import {
  Package,
  Truck,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DeliveryMilestoneStepper } from './DeliveryMilestoneStepper';
import './OrderCard.css';

/**
 * Format currency helper in Sri Lankan Rupees (LKR)
 */
function formatLKR(amount) {
  return `LKR ${(Number(amount) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format date helper
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * OrderCard Component
 *
 * Displays individual order summary with status badge, thumbnails, total in LKR,
 * and expandable 4-stage delivery milestone stepper (AC2 & AC3).
 */
export function OrderCard({ order, onViewInvoice, onReturnRequest, className = '' }) {
  const [isTrackingExpanded, setIsTrackingExpanded] = useState(
    order?.status?.toLowerCase() === 'shipped' || order?.status?.toLowerCase() === 'processing'
  );

  if (!order) return null;

  const status = (order.status || 'placed').toLowerCase();
  const itemCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

  // Status Badge Class
  const statusColorMap = {
    placed: 'order-status--placed',
    processing: 'order-status--processing',
    shipped: 'order-status--shipped',
    delivered: 'order-status--delivered',
    cancelled: 'order-status--cancelled',
  };
  const statusClass = statusColorMap[status] || 'order-status--placed';

  return (
    <div
      className={`order-card ${className}`}
      data-testid={`order-card-${order.id || order.order_number}`}
    >
      {/* Top Header Row */}
      <div className="order-card__header">
        <div className="order-card__info-group">
          <div className="order-card__ref-row">
            <span className="order-card__ref-label">Order Ref:</span>
            <strong className="order-card__ref-number" data-testid="order-number-text">
              {order.order_number || order.id}
            </strong>
          </div>
          <div className="order-card__date-row">
            <Calendar size={13} />
            <span data-testid="order-placed-date">Placed on {formatDate(order.created_at)}</span>
          </div>
        </div>

        <div className="order-card__status-group">
          <span className={`order-status-pill ${statusClass}`} data-testid="order-status-badge">
            <span className="status-dot" />
            <span>{status.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Middle Items Preview */}
      <div className="order-card__body">
        <div className="order-card__items-preview" data-testid="order-items-preview">
          {(order.items || []).map((item, idx) => (
            <div key={item.id || idx} className="order-item-chip" data-testid="order-item-chip">
              <div className="order-item-thumb-wrapper">
                <img
                  src={
                    item.image_url ||
                    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=120&q=80'
                  }
                  alt={item.title}
                  className="order-item-thumb"
                  data-testid="item-thumbnail"
                />
                <span className="order-item-qty-badge" data-testid="item-qty-badge">
                  {item.quantity}
                </span>
              </div>
              <div className="order-item-meta">
                <span className="order-item-title">{item.title}</span>
                <span className="order-item-variant">
                  {item.size ? `Size: ${item.size}` : ''}
                  {item.color ? ` • ${item.color}` : ''}
                </span>
                <span className="order-item-price">
                  {formatLKR(item.total_price || item.unit_price)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary Block */}
        <div className="order-card__total-box">
          <span className="total-label">Total Amount</span>
          <span className="total-amount" data-testid="order-total-lkr">
            {formatLKR(order.total_amount)}
          </span>
          <span className="total-items-note">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} • Free Islandwide
          </span>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="order-card__footer">
        <div className="order-card__actions-left">
          <button
            type="button"
            className="order-action-btn order-action-btn--track"
            onClick={() => setIsTrackingExpanded(!isTrackingExpanded)}
            data-testid="track-order-btn"
          >
            <Truck size={15} />
            <span>{isTrackingExpanded ? 'Hide Tracking' : 'Track Delivery'}</span>
            {isTrackingExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {onViewInvoice && (
            <button
              type="button"
              className="order-action-btn order-action-btn--secondary"
              onClick={() => onViewInvoice(order)}
              data-testid="view-invoice-btn"
            >
              <FileText size={15} />
              <span>Invoice</span>
            </button>
          )}

          {status === 'delivered' && onReturnRequest && (
            <button
              type="button"
              className="order-action-btn order-action-btn--secondary"
              onClick={() => onReturnRequest(order)}
              data-testid="return-request-btn"
            >
              <RotateCcw size={15} />
              <span>Return / Exchange</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable 4-Stage Milestone Stepper (AC3) */}
      {isTrackingExpanded && (
        <div className="order-card__stepper-wrapper" data-testid="order-tracking-stepper-wrap">
          <DeliveryMilestoneStepper
            status={order.status}
            orderDate={order.created_at}
            estimatedDelivery={order.estimated_delivery}
            carrier={order.carrier}
            trackingNumber={order.tracking_number}
            milestones={order.milestones}
          />
        </div>
      )}
    </div>
  );
}

export default OrderCard;
