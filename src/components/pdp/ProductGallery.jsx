import React, { useState } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './ProductGallery.css';

/**
 * ProductGallery Component (STORM-FE-007)
 * Interactive image gallery with primary stage, thumbnail carousel, and click-to-zoom modal view.
 *
 * @param {Object} props
 * @param {Array} props.images - Array of image objects ({ id, image_url, alt_text, is_primary })
 * @param {string} props.title - Product title for accessibility alt text
 * @param {string} [props.badge] - Optional badge tag (e.g. "Artisan Batik")
 */
export function ProductGallery({ images = [], title = 'Product', badge = null }) {
  // Ensure we always have at least one fallback image
  const displayImages =
    images.length > 0
      ? images
      : [
          {
            id: 'default',
            image_url:
              'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
            alt_text: title,
          },
        ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const activeImage = displayImages[activeIndex] || displayImages[0];

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="pdp-gallery" data-testid="pdp-gallery">
      {/* Primary Display Stage */}
      <div className="pdp-gallery__stage">
        {badge && <span className="pdp-gallery__badge">{badge}</span>}

        <img
          src={activeImage.image_url}
          alt={activeImage.alt_text || `${title} - Image ${activeIndex + 1}`}
          className="pdp-gallery__main-img"
          data-testid="pdp-main-image"
          onClick={() => setIsZoomOpen(true)}
        />

        <button
          type="button"
          className="pdp-gallery__zoom-btn"
          onClick={() => setIsZoomOpen(true)}
          data-testid="pdp-zoom-trigger"
          aria-label="Zoom product image"
        >
          <ZoomIn size={14} />
          <span>Click to Zoom</span>
        </button>
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="pdp-gallery__thumbnails" role="tablist" aria-label="Product thumbnails">
          {displayImages.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`View image ${idx + 1} of ${displayImages.length}`}
                className={`pdp-gallery__thumb-btn ${isActive ? 'is-active' : ''}`}
                data-testid={`pdp-thumbnail-${idx}`}
                onClick={() => setActiveIndex(idx)}
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || `Thumbnail ${idx + 1}`}
                  className="pdp-gallery__thumb-img"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Click-to-Zoom High-Resolution Modal View (AC2) */}
      {isZoomOpen && (
        <div
          className="pdp-zoom-modal__backdrop"
          data-testid="pdp-zoom-modal"
          onClick={() => setIsZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image preview"
        >
          <div className="pdp-zoom-modal__dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pdp-zoom-modal__close"
              onClick={() => setIsZoomOpen(false)}
              data-testid="pdp-zoom-close"
              aria-label="Close zoomed view"
            >
              <X size={20} />
            </button>

            <img
              src={activeImage.image_url}
              alt={activeImage.alt_text || `${title} Enlarged View`}
              className="pdp-zoom-modal__img"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
