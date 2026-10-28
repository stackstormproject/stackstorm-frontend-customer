import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import './WishlistButton.css';

/**
 * WishlistButton Component (STORM-FE-008)
 * Animated heart toggle with optimistic UI update, heart pop scale micro-animation,
 * and stopPropagation protection for card/PDP container nesting.
 */
export function WishlistButton({
  product = {},
  isWishlisted = false,
  onToggle = null,
  size = 18,
  className = '',
  showLabel = false,
  dataTestId = null,
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);

    if (onToggle) {
      onToggle(product);
    }
  };

  const label = isWishlisted ? 'Remove from wishlist' : 'Save to wishlist';

  return (
    <button
      type="button"
      className={`wishlist-heart-btn ${isWishlisted ? 'is-active' : ''} ${isAnimating ? 'is-animating' : ''} ${className}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
      data-testid={dataTestId || `wishlist-btn-${product.id || 'default'}`}
    >
      <Heart
        size={size}
        className="wishlist-heart-icon"
        fill={isWishlisted ? '#E11D48' : 'none'}
        color={isWishlisted ? '#E11D48' : 'currentColor'}
      />
      {showLabel && (
        <span
          style={{ marginLeft: 6, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}
        >
          {isWishlisted ? 'Wishlisted' : 'Save'}
        </span>
      )}
    </button>
  );
}

export default WishlistButton;
