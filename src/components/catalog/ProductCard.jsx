import React from 'react';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { formatLKR, formatRating } from '../../utils/formatters';
import './ProductCard.css';

export const ProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  onViewDetails,
  isWishlisted = false,
}) => {
  if (!product) return null;

  const {
    id,
    title,
    base_price,
    category_name,
    primary_image,
    secondary_image,
    rating = 4.8,
    review_count = 35,
    badge,
    availableStock,
  } = product;

  const isLowStock = availableStock && availableStock <= 15;

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    }
  };

  return (
    <div
      className="dk-product-card"
      data-testid={`product-card-${id || product.slug}`}
      onClick={handleCardClick}
    >
      {/* Media container with secondary image hover */}
      <div className="dk-card-media">
        {badge && <span className="dk-card-badge">{badge}</span>}

        <button
          type="button"
          className={`dk-card-wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          data-testid="card-wishlist-btn"
        >
          <Heart size={16} fill={isWishlisted ? '#EF4444' : 'none'} />
        </button>

        <img
          src={primary_image}
          alt={title}
          className="dk-card-img dk-card-img--primary"
          loading="lazy"
        />

        {secondary_image && secondary_image !== primary_image && (
          <img
            src={secondary_image}
            alt={`${title} alternate view`}
            className="dk-card-img dk-card-img--secondary"
            loading="lazy"
          />
        )}
      </div>

      {/* Card Content Details */}
      <div className="dk-card-body">
        <div className="dk-card-meta">
          <span className="dk-card-category">{category_name}</span>
          <div className="dk-card-rating" aria-label={`Rating ${rating} stars`}>
            <Star size={13} fill="#D4AF37" color="#D4AF37" />
            <span>{formatRating(rating)} ({review_count})</span>
          </div>
        </div>

        <h3 className="dk-card-title" title={title}>
          {title}
        </h3>

        <div className="dk-card-footer">
          <div className="dk-card-price-group">
            <span className="dk-card-price" data-testid="card-formatted-price">
              {formatLKR(base_price)}
            </span>
            <span
              className="dk-card-stock-hint"
              style={{ color: isLowStock ? 'var(--color-warning)' : 'var(--color-success)' }}
            >
              {isLowStock ? `Only ${availableStock} left!` : 'In Stock • Ready to dispatch'}
            </span>
          </div>

          <button
            type="button"
            className="dk-card-quick-add"
            onClick={handleAddToCartClick}
            aria-label={`Quick add ${title} to cart`}
            data-testid="card-quick-add-btn"
          >
            <ShoppingBag size={14} />
            <span>Quick Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
