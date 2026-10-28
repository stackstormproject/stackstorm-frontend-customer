import React from 'react';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { formatLKR } from '../utils/formatters';
import './WishlistPage.css';

/**
 * WishlistPage Component (STORM-FE-008)
 * Implements FR-012 Wishlist UI & SDS §8.3 Customer Wishlists.
 * Displays saved apparel products, handles instant removal, Move-to-Cart transfers,
 * and empty state guidance.
 */
export function WishlistPage({
  items = [],
  onRemoveItem = null,
  onMoveToCart = null,
  onClearWishlist = null,
  onViewDetails = null,
  onExploreCatalog = null,
}) {
  const hasItems = items && items.length > 0;

  return (
    <div className="wishlist-page" data-testid="wishlist-page">
      <div className="container">
        {/* Header Bar */}
        <div className="wishlist-page__header" data-testid="wishlist-header">
          <div className="wishlist-page__title-group">
            <h1 className="wishlist-page__title">
              <Heart size={26} fill="#E11D48" color="#E11D48" />
              <span>My Saved Wishlist</span>
              {hasItems && (
                <span className="wishlist-page__count-badge" data-testid="wishlist-count-badge">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </h1>
            <p className="wishlist-page__subtitle">
              Authentic Sri Lankan artisan garments saved for your next shopping order.
            </p>
          </div>

          <div className="wishlist-page__actions">
            {onExploreCatalog && (
              <button
                type="button"
                className="wishlist-clear-btn"
                onClick={onExploreCatalog}
                data-testid="wishlist-back-btn"
              >
                <ArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} />
                <span>Continue Shopping</span>
              </button>
            )}

            {hasItems && onClearWishlist && (
              <button
                type="button"
                className="wishlist-clear-btn"
                onClick={onClearWishlist}
                data-testid="wishlist-clear-all-btn"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Stock Alert Notification Banner */}
        {hasItems && (
          <div className="wishlist-alert-banner">
            <AlertCircle size={18} />
            <div>
              <strong>Inventory Notice:</strong> Items saved to your wishlist are not reserved until
              checkout. Grab your favorite sizes before they sell out!
            </div>
          </div>
        )}

        {/* Content: Either Empty State or Populated Grid (AC3) */}
        {!hasItems ? (
          <div className="wishlist-empty-state" data-testid="wishlist-empty-state">
            <div className="wishlist-empty-icon-wrap">
              <Heart size={36} />
            </div>
            <h2 className="wishlist-empty-title">Your Wishlist is Empty</h2>
            <p className="wishlist-empty-desc">
              You haven't saved any handcrafted Sri Lankan batik shirts or handloom sarees yet.
              Click the heart icon on any product in our catalog to save your favorites for later!
            </p>
            {onExploreCatalog && (
              <button
                type="button"
                className="wishlist-empty-cta"
                onClick={onExploreCatalog}
                data-testid="wishlist-empty-cta"
              >
                <Sparkles size={16} color="#D4AF37" />
                <span>Explore Catalog</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="wishlist-grid" data-testid="wishlist-grid">
            {items.map((item) => {
              const product = item.product || item;
              const productId = product.id || item.product_id;
              const inStock =
                item.in_stock !== undefined
                  ? item.in_stock
                  : (product.availableStock ??
                      product.stock_quantity ??
                      (product.variants && product.variants.length > 0 ? 1 : 0)) > 0;
              const price =
                product.base_price !== undefined
                  ? Number(product.base_price)
                  : product.price !== undefined
                    ? Number(product.price)
                    : 0;
              const title = product.title || product.name || 'Artisan Handloom Garment';
              const imgUrl =
                product.primary_image ||
                product.primaryImage ||
                (product.images && product.images[0]?.image_url) ||
                'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80';
              const categoryName =
                product.category_name ||
                (typeof product.category === 'string'
                  ? product.category
                  : product.category?.name) ||
                'Handloom Apparel';

              return (
                <div
                  key={productId}
                  className="wishlist-card"
                  data-testid={`wishlist-card-${productId}`}
                >
                  {/* Image container */}
                  <div
                    className="wishlist-card__image-container"
                    onClick={() => onViewDetails && onViewDetails(product)}
                  >
                    <img
                      src={imgUrl}
                      alt={title}
                      className="wishlist-card__image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Instant remove action */}
                    <button
                      type="button"
                      className="wishlist-card__remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRemoveItem) onRemoveItem(productId);
                      }}
                      aria-label={`Remove ${title} from wishlist`}
                      title="Remove from wishlist"
                      data-testid={`remove-wishlist-${productId}`}
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Stock status badge */}
                    <span
                      className={`wishlist-card__stock-tag ${inStock ? 'wishlist-card__stock-tag--in' : 'wishlist-card__stock-tag--out'}`}
                      data-testid={`stock-tag-${productId}`}
                    >
                      {inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="wishlist-card__body">
                    <span className="wishlist-card__category">{categoryName}</span>

                    <h3
                      className="wishlist-card__title"
                      onClick={() => onViewDetails && onViewDetails(product)}
                      style={{ cursor: onViewDetails ? 'pointer' : 'default' }}
                    >
                      {title}
                    </h3>

                    <div className="wishlist-card__price">{formatLKR(price)}</div>

                    <div className="wishlist-card__actions">
                      <button
                        type="button"
                        className="wishlist-btn-move"
                        onClick={() => onMoveToCart && onMoveToCart(product)}
                        disabled={!inStock}
                        data-testid={`move-to-cart-${productId}`}
                      >
                        <ShoppingBag size={15} />
                        <span>{inStock ? 'Move to Cart' : 'Out of Stock'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;
