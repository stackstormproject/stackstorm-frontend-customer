import React, { useState } from 'react';
import {
  X,
  Star,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Trash2,
} from 'lucide-react';
import reviewApi from '../../api/review.api';
import './WriteReviewModal.css';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (AC3)

/**
 * WriteReviewModal Component
 *
 * Verified customer review submission with 1-5 star selector,
 * text commentary, and client-side validated image upload (AC3 & AC4).
 */
export function WriteReviewModal({ isOpen = false, onClose, product, order = null, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  if (!isOpen || !product) return null;

  // Gate Check: Verified Buyer Requirement (AC4)
  // If order is passed and status is not delivered, enforce the verification explanation gate
  const isDelivered = !order || (order.status || '').toLowerCase() === 'delivered';

  const handleFileChange = (e) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // MIME type check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError('Invalid image format. Only JPEG, PNG, and WebP are accepted.');
      return;
    }

    // Size check (max 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('Image file is too large. Maximum permitted size is 5MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (rating < 1 || rating > 5) {
      setServerError('Please select a star rating between 1 and 5.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setServerError(
        'Please share at least 10 characters about your experience with this garment.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewPayload = {
        rating,
        title: title.trim() || 'Verified Purchase',
        comment: comment.trim(),
        imageFile: selectedFile,
        order_id: order?.id || order?.order_number,
      };

      const result = await reviewApi.submitReview(product.id, reviewPayload);
      if (typeof onSuccess === 'function') {
        onSuccess(result);
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      setServerError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="review-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof onClose === 'function') onClose();
      }}
      data-testid="write-review-modal-overlay"
    >
      <div
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        data-testid="write-review-modal"
      >
        {/* Close Button */}
        <button
          type="button"
          className="review-modal__close-btn"
          onClick={onClose}
          aria-label="Close review dialog"
          data-testid="close-review-modal-btn"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="review-modal__header">
          <div className="review-modal__badge">
            <ShieldCheck size={14} />
            <span>Verified Customer Community</span>
          </div>
          <h3 id="review-modal-title" className="review-modal__title">
            Write a Review for {product.title}
          </h3>
          <p className="review-modal__subtitle">
            Your honest feedback helps fellow patrons choose handcrafted Ceylon batik garments.
          </p>
        </div>

        {/* Non-Delivered Gate Explanation (AC4) */}
        {!isDelivered ? (
          <div className="review-modal__gate-card" data-testid="review-gate-card">
            <AlertCircle size={32} className="gate-icon" />
            <h4>Verified Delivered Purchases Only</h4>
            <p>
              To protect the integrity of artisan craftsmanship ratings, reviews can only be
              submitted after your order has reached <strong>Delivered</strong> status and you have
              received the garment.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              data-testid="gate-close-btn"
            >
              Understood
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="review-modal__form" data-testid="review-form">
            {/* Server Error Alert */}
            {serverError && (
              <div
                className="review-modal__error-banner"
                role="alert"
                data-testid="review-error-banner"
              >
                <AlertCircle size={16} />
                <span>{serverError}</span>
              </div>
            )}

            {/* 1-5 Star Rating Selector (AC3) */}
            <div className="form-group review-rating-group">
              <label className="form-label">
                Overall Satisfaction <span className="text-danger">*</span>
              </label>
              <div
                className="star-rating-row"
                role="radiogroup"
                aria-label="Rating stars"
                data-testid="star-rating-row"
              >
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = (hoverRating || rating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      className={`star-btn ${isFilled ? 'star-btn--filled' : ''}`}
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${starVal} star${starVal > 1 ? 's' : ''}`}
                      data-testid={`star-btn-${starVal}`}
                    >
                      <Star
                        size={24}
                        fill={isFilled ? '#F59E0B' : 'none'}
                        color={isFilled ? '#F59E0B' : '#94A3B8'}
                      />
                    </button>
                  );
                })}
                <span className="rating-text-label" data-testid="rating-score-text">
                  {rating === 5 ? '5 Stars - Exceptional Heritage Quality' : `${rating} Stars`}
                </span>
              </div>
            </div>

            {/* Review Headline Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="review-headline">
                Review Headline (Optional)
              </label>
              <input
                id="review-headline"
                type="text"
                className="form-input"
                placeholder="e.g. Gorgeous organic linen texture and vibrant batik dyes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                data-testid="input-review-title"
              />
            </div>

            {/* Review Comment Textarea */}
            <div className="form-group">
              <label className="form-label" htmlFor="review-body">
                Detailed Review <span className="text-danger">*</span>
              </label>
              <textarea
                id="review-body"
                className="form-textarea"
                rows={4}
                placeholder="How does the fabric feel in tropical heat? Did the sizing match our measurement charts? Share your thoughts..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                data-testid="textarea-review-comment"
              />
              <span className="form-help">Minimum 10 characters required.</span>
            </div>

            {/* Image Attachment with Client MIME & 5MB Size Validation (AC3) */}
            <div className="form-group">
              <label className="form-label">Upload Photo of Garment (Optional, Max 5MB)</label>

              {fileError && (
                <div className="review-file-error" role="alert" data-testid="file-error-alert">
                  <AlertCircle size={14} />
                  <span>{fileError}</span>
                </div>
              )}

              {filePreview ? (
                <div className="review-file-preview-card" data-testid="file-preview-card">
                  <img
                    src={filePreview}
                    alt="Review attachment preview"
                    className="preview-image"
                  />
                  <div className="preview-meta">
                    <span className="preview-filename">{selectedFile?.name}</span>
                    <span className="preview-filesize">
                      {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    className="preview-remove-btn"
                    onClick={handleRemoveFile}
                    aria-label="Remove image"
                    data-testid="remove-file-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <label
                  className="review-dropzone"
                  htmlFor="review-file-input"
                  data-testid="review-dropzone"
                >
                  <Upload size={20} className="dropzone-icon" />
                  <div>
                    <span className="dropzone-text">Click to choose image or drag & drop</span>
                    <span className="dropzone-sub">Accepts JPEG, PNG, WebP up to 5MB</span>
                  </div>
                  <input
                    id="review-file-input"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    data-testid="input-review-file"
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="review-modal__footer">
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
                disabled={isSubmitting}
                data-testid="submit-review-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner-icon" />
                    <span>Publishing Review...</span>
                  </>
                ) : (
                  <span>Publish Verified Review</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default WriteReviewModal;
