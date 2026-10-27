import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  ArrowRightLeft,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
} from 'lucide-react';
import { isReturnEligible, returnApi } from '../../api/return.api';
import './ReturnExchangeModal.css';

/**
 * ReturnExchangeModal Component
 *
 * Supports requesting a return for refund or a size/color exchange
 * within the strict 30-day window from order.delivered_at (AC1 & AC2).
 */
export function ReturnExchangeModal({
  isOpen = false,
  onClose,
  order,
  item: initialItem = null,
  onSuccess,
}) {
  const [selectedItem, setSelectedItem] = useState(initialItem || order?.items?.[0] || null);
  const [requestType, setRequestType] = useState('return'); // 'return' | 'exchange'
  const [reason, setReason] = useState('Size Too Small / Tight');
  const [replacementSize, setReplacementSize] = useState('L');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen || !order) return null;

  const currentItem = selectedItem || order?.items?.[0];
  const eligibility = isReturnEligible(order, currentItem);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eligibility.eligible) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        order_id: order.order_number || order.id,
        item_id: currentItem?.id,
        type: requestType,
        reason,
        replacement_size: requestType === 'exchange' ? replacementSize : null,
        comments: comments.trim(),
      };

      const result = await returnApi.requestReturn(payload);
      if (typeof onSuccess === 'function') {
        onSuccess(result);
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit return request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="return-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof onClose === 'function') onClose();
      }}
      data-testid="return-exchange-modal-overlay"
    >
      <div
        className="return-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
        data-testid="return-exchange-modal"
      >
        {/* Close Button */}
        <button
          type="button"
          className="return-modal__close-btn"
          onClick={onClose}
          aria-label="Close return modal"
          data-testid="close-return-modal-btn"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="return-modal__header">
          <div className="return-modal__badge">
            <RotateCcw size={14} />
            <span>30-Day Southern Province Guarantee</span>
          </div>
          <h3 id="return-modal-title" className="return-modal__title">
            Request Return or Size Exchange
          </h3>
          <p className="return-modal__subtitle">
            Order Reference: <strong>{order.order_number || order.id}</strong>
          </p>
        </div>

        {/* Eligibility Banner (AC1) */}
        {!eligibility.eligible ? (
          <div
            className="return-modal__ineligible-banner"
            role="alert"
            data-testid="ineligible-return-banner"
          >
            <ShieldAlert size={20} />
            <div>
              <strong>Item Ineligible for Return</strong>
              <p>{eligibility.reason}</p>
            </div>
          </div>
        ) : (
          <div className="return-modal__eligible-banner" data-testid="eligible-return-banner">
            <CheckCircle2 size={18} />
            <span>
              Eligible for return or exchange ({eligibility.daysRemaining} days remaining in 30-day
              window).
            </span>
          </div>
        )}

        {/* Selected Item Preview */}
        {currentItem && (
          <div className="return-modal__item-card" data-testid="return-item-preview">
            <img
              src={
                currentItem.image_url ||
                'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=120&q=80'
              }
              alt={currentItem.title}
              className="return-item-thumb"
            />
            <div className="return-item-meta">
              <span className="return-item-title">{currentItem.title}</span>
              <span className="return-item-details">
                Size: {currentItem.size || 'Standard'} • Color:{' '}
                {currentItem.color || 'Artisan Indigo'}
              </span>
              <span className="return-item-price">
                LKR {(currentItem.total_price || currentItem.unit_price || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="return-modal__error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Return / Exchange Form */}
        <form onSubmit={handleSubmit} className="return-modal__form">
          {/* Action Type Toggle (AC2) */}
          <div className="return-type-selector" role="radiogroup" aria-label="Request type">
            <button
              type="button"
              className={`return-type-btn ${requestType === 'return' ? 'return-type-btn--active' : ''}`}
              onClick={() => setRequestType('return')}
              disabled={!eligibility.eligible}
              data-testid="btn-type-return"
            >
              <RotateCcw size={16} />
              <div>
                <strong>Return for Refund</strong>
                <p>Original payment method reimbursement</p>
              </div>
            </button>

            <button
              type="button"
              className={`return-type-btn ${requestType === 'exchange' ? 'return-type-btn--active' : ''}`}
              onClick={() => setRequestType('exchange')}
              disabled={!eligibility.eligible}
              data-testid="btn-type-exchange"
            >
              <ArrowRightLeft size={16} />
              <div>
                <strong>Size / Color Exchange</strong>
                <p>Swap for another variant in stock</p>
              </div>
            </button>
          </div>

          {/* Reason Dropdown */}
          <div className="form-group">
            <label className="form-label" htmlFor="return-reason">
              Reason for Request <span className="text-danger">*</span>
            </label>
            <select
              id="return-reason"
              className="form-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={!eligibility.eligible}
              data-testid="select-return-reason"
            >
              <option value="Size Too Small / Tight">Size Too Small / Tight</option>
              <option value="Size Too Large / Loose">Size Too Large / Loose</option>
              <option value="Color Differs from Screen">Color Differs from Screen</option>
              <option value="Defective Stitching or Weave">Defective Stitching or Weave</option>
              <option value="Changed Mind / Unworn">Changed Mind / Unworn</option>
            </select>
          </div>

          {/* Exchange Variant Selector if exchange */}
          {requestType === 'exchange' && (
            <div className="form-group" data-testid="exchange-variant-group">
              <label className="form-label" htmlFor="exchange-size">
                Requested Replacement Size <span className="text-danger">*</span>
              </label>
              <select
                id="exchange-size"
                className="form-select"
                value={replacementSize}
                onChange={(e) => setReplacementSize(e.target.value)}
                data-testid="select-exchange-size"
              >
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE'].map((sz) => (
                  <option key={sz} value={sz}>
                    Size {sz}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Additional Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="return-comments">
              Additional Details or Comments (Optional)
            </label>
            <textarea
              id="return-comments"
              className="form-textarea"
              rows={3}
              placeholder="Provide any details about fabric fit, packaging condition, or drop-off location..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={!eligibility.eligible}
              data-testid="textarea-return-comments"
            />
          </div>

          {/* Policy Note */}
          <div className="return-modal__policy-note">
            <Package size={14} />
            <span>
              Garments must be unwashed, unworn, and have original Dickwella Fashion Corner tags
              intact.
            </span>
          </div>

          {/* Submit Action */}
          <div className="return-modal__footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!eligibility.eligible || isSubmitting}
              data-testid="submit-return-request-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner-icon" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>
                  {requestType === 'exchange' ? 'Confirm Size Exchange' : 'Submit Return Request'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReturnExchangeModal;
