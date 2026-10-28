import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ProductGallery, VariantSelector } from '../components/pdp';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';
import { productApi, FALLBACK_PRODUCTS } from '../api/product.api';
import { formatRating } from '../utils/formatters';
import { WriteReviewModal } from '../components/reviews/WriteReviewModal';
import './ProductDetailPage.css';

/**
 * ProductDetailPage Component (STORM-FE-007)
 * Implements FR-007 Product Details & SDS §7.3 Variant Matrix.
 * Loads product by slug, manages image gallery preview, resolves physical SKU via variant matrix,
 * displays real-time stock availability, and regulates Add to Cart & 15-min stock locks.
 */
export function ProductDetailPage({
  productSlug = 'classic-batik-short-sleeve-shirt',
  initialProduct = null,
  onBack,
  onAddToCart,
  onReserveStock,
  onToggleWishlist,
  isWishlisted = false,
  onNotifyMe,
}) {
  const [product, setProduct] = useState(initialProduct || FALLBACK_PRODUCTS[0]);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'delivery' | 'reviews'
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Load product data dynamically by slug (AC1)
  useEffect(() => {
    let isMounted = true;

    if (initialProduct && initialProduct.slug === productSlug) {
      setProduct(initialProduct);
      const defaultColor = initialProduct.colors?.[0] || '';
      const defaultSize = initialProduct.sizes?.[0] || '';
      setSelectedColor(defaultColor);
      setSelectedSize(defaultSize);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    productApi
      .getProductBySlug(productSlug)
      .then((data) => {
        if (isMounted && data) {
          setProduct(data);
          const defaultColor = data.colors?.[0] || '';
          const defaultSize = data.sizes?.[0] || '';
          setSelectedColor(defaultColor);
          setSelectedSize(defaultSize);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProduct(FALLBACK_PRODUCTS[0]);
          setSelectedColor(FALLBACK_PRODUCTS[0].colors?.[0] || '');
          setSelectedSize(FALLBACK_PRODUCTS[0].sizes?.[0] || '');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productSlug, initialProduct]);

  // When product changes, initialize color and size defaults if unset
  useEffect(() => {
    if (product) {
      if (!selectedColor && product.colors?.length > 0) {
        setSelectedColor(product.colors[0]);
      }
      if (!selectedSize && product.sizes?.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
    }
  }, [product, selectedColor, selectedSize]);

  // Dynamic breadcrumb trail for PDP
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: product.category_name || product.category?.name || 'Collections', href: '#catalog' },
    { label: product.title, active: true },
  ];

  return (
    <div className="pdp-page" data-testid="pdp-page">
      <div className="container">
        {/* Navigation & Breadcrumbs */}
        <div className="pdp-nav-bar">
          <button
            type="button"
            className="pdp-back-btn"
            onClick={onBack}
            data-testid="pdp-back-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to Catalog</span>
          </button>

          <button
            type="button"
            className={`pdp-wishlist-toggle ${isWishlisted ? 'is-wishlisted' : ''}`}
            onClick={() => onToggleWishlist && onToggleWishlist(product)}
            data-testid="pdp-wishlist-btn"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart
              size={18}
              fill={isWishlisted ? '#E11D48' : 'none'}
              color={isWishlisted ? '#E11D48' : 'currentColor'}
            />
            <span>{isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
          </button>
        </div>

        <Breadcrumbs items={breadcrumbItems} />

        {/* Main Two-Column PDP Grid */}
        <div className="pdp-grid">
          {/* Column 1: Image Gallery with Thumbnails & Zoom Modal (AC2) */}
          <div className="pdp-gallery-column">
            <ProductGallery images={product.images} title={product.title} badge={product.badge} />
          </div>

          {/* Column 2: Purchase & Variant Resolution Panel (AC3, AC4) */}
          <div className="pdp-info">
            <span className="pdp-category-tag">
              {product.category_name || product.category?.name || 'Artisan Apparel'}
            </span>

            <h1 className="pdp-title" data-testid="pdp-product-title">
              {product.title}
            </h1>

            {/* Ratings & Verified Reviews */}
            <div className="pdp-rating-row">
              <div className="pdp-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.floor(product.rating || 5) ? '#D4AF37' : 'none'}
                    color="#D4AF37"
                  />
                ))}
              </div>
              <span className="pdp-rating-num">{formatRating(product.rating || 4.8)}</span>
              <span className="pdp-review-count">
                ({product.review_count || 1} verified customer review
                {product.review_count === 1 ? '' : 's'})
              </span>
            </div>

            <p className="pdp-description">{product.description}</p>

            <div className="pdp-divider" />

            {/* Interactive Variant Matrix & Stock Resolver */}
            <VariantSelector
              product={product}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={onAddToCart}
              onReserveStock={onReserveStock}
              onNotifyMe={onNotifyMe}
            />

            {/* Trust & Provenance Perks */}
            <div className="pdp-trust-perks">
              <div className="pdp-perk-item">
                <Truck size={16} className="pdp-perk-icon" />
                <span>Islandwide Delivery (1–3 Days)</span>
              </div>
              <div className="pdp-perk-item">
                <ShieldCheck size={16} className="pdp-perk-icon" />
                <span>100% Genuine Dickwella Handloom</span>
              </div>
              <div className="pdp-perk-item">
                <RotateCcw size={16} className="pdp-perk-icon" />
                <span>30-Day Hassle-Free Returns</span>
              </div>
              <div className="pdp-perk-item">
                <Award size={16} className="pdp-perk-icon" />
                <span>Earn Double Loyalty Points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Specifications, Delivery & Customer Reviews */}
        <div className="pdp-tabs-section">
          <div className="pdp-tabs-header" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'specs'}
              className={`pdp-tab-btn ${activeTab === 'specs' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('specs')}
              data-testid="tab-specs"
            >
              Artisan Craft & Specifications
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'delivery'}
              className={`pdp-tab-btn ${activeTab === 'delivery' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('delivery')}
              data-testid="tab-delivery"
            >
              Islandwide Shipping & Returns
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              className={`pdp-tab-btn ${activeTab === 'reviews' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('reviews')}
              data-testid="tab-reviews"
            >
              Customer Reviews ({product.review_count || 1})
            </button>
          </div>

          <div className="pdp-tab-content">
            {activeTab === 'specs' && (
              <div className="pdp-specs-grid" data-testid="tab-content-specs">
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Fabric & Fiber</div>
                  <div className="pdp-spec-value">
                    100% Natural Breathable Sri Lankan Cotton / Linen
                  </div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Dye Technique</div>
                  <div className="pdp-spec-value">
                    Wax-Resist Hand Batik & Natural Vegetable Dyes
                  </div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Provenance</div>
                  <div className="pdp-spec-value">Dickwella Artisan Loom & Workshop, Matara</div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Care Instructions</div>
                  <div className="pdp-spec-value">Gentle Cold Hand Wash, Shade Dry, Warm Iron</div>
                </div>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="pdp-specs-grid" data-testid="tab-content-delivery">
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Southern Province Delivery</div>
                  <div className="pdp-spec-value">
                    Same-day or next-day delivery across Matara, Galle & Hambantota
                  </div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Islandwide Express</div>
                  <div className="pdp-spec-value">
                    1–3 business days via Sri Lanka Post Express & Prompt Courier
                  </div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Free Shipping Threshold</div>
                  <div className="pdp-spec-value">
                    Complimentary delivery for orders exceeding LKR 10,000
                  </div>
                </div>
                <div className="pdp-spec-card">
                  <div className="pdp-spec-label">Exchange Policy</div>
                  <div className="pdp-spec-value">
                    30-day exchange window for unworn items with original tags
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="pdp-reviews-list" data-testid="tab-content-reviews">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    Customer Community Ratings
                  </span>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setIsReviewModalOpen(true)}
                    data-testid="write-review-btn"
                  >
                    <Sparkles size={14} color="#D4AF37" />
                    <span>Write a Review</span>
                  </button>
                </div>

                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev) => (
                    <div key={rev.id} className="pdp-review-card">
                      <div className="pdp-review-header">
                        <span className="pdp-review-title">{rev.title || 'Verified Customer'}</span>
                        {rev.is_verified_purchase && (
                          <span className="pdp-review-badge">
                            <CheckCircle2 size={14} /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <div className="pdp-stars" style={{ marginBottom: 'var(--space-2)' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < (rev.rating || 5) ? '#D4AF37' : 'none'}
                            color="#D4AF37"
                          />
                        ))}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {rev.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="pdp-review-card">
                    <div className="pdp-review-header">
                      <span className="pdp-review-title">
                        Southern Province Heritage Enthusiast
                      </span>
                      <span className="pdp-review-badge">
                        <CheckCircle2 size={14} /> Verified Buyer
                      </span>
                    </div>
                    <div className="pdp-stars" style={{ marginBottom: 'var(--space-2)' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#D4AF37" color="#D4AF37" />
                      ))}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Superb quality batik shirt! The ocean blue dye pattern is distinct and the
                      breathable cotton is ideal for coastal weather in Matara.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verified Customer Write Review Modal (STORM-FE-016) */}
      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        product={product}
        onSuccess={(newRev) => {
          setIsReviewModalOpen(false);
          setProduct((prev) => ({
            ...prev,
            reviews: [newRev, ...(prev.reviews || [])],
          }));
        }}
      />
    </div>
  );
}

export default ProductDetailPage;
