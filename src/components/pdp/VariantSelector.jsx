import React from 'react';
import { ShoppingBag, Bell, Shield, Minus, Plus, Check } from 'lucide-react';
import { formatLKR } from '../../utils/formatters';
import './VariantSelector.css';

// Curated map for realistic color swatches
const COLOR_HEX_MAP = {
  'ocean blue': '#2563EB',
  'indigo navy': '#0A192F',
  'kandyan red': '#B91C1C',
  'ceylon emerald': '#047857',
  'earthy ochre': '#B45309',
  'natural sand': '#D7C4A5',
  'pure white': '#FFFFFF',
  charcoal: '#334155',
};

function getColorHex(colorName = '') {
  const normalized = colorName.toLowerCase().trim();
  return COLOR_HEX_MAP[normalized] || '#64748B';
}

/**
 * VariantSelector Component (STORM-FE-007)
 * Resolves discrete physical SKU by Color and Size combinations, updates live stock status,
 * and regulates Add to Cart / Reservation availability.
 */
export function VariantSelector({
  product = {},
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  quantity = 1,
  onQuantityChange,
  onAddToCart,
  onReserveStock,
  onNotifyMe,
}) {
  const variants = product.variants || [];
  const colors = product.colors || [];
  const sizes = product.sizes || [];

  // Resolve matching variant from selected attributes
  const activeVariant =
    variants.find(
      (v) =>
        (!selectedColor || v.color?.toLowerCase() === selectedColor?.toLowerCase()) &&
        (!selectedSize || v.size?.toUpperCase() === selectedSize?.toUpperCase())
    ) ||
    variants[0] ||
    null;

  // Safe non-negative available stock calculation (Failure Recovery Matrix fix)
  const availableStock = activeVariant
    ? Math.max(0, (activeVariant.stock_quantity || 0) - (activeVariant.reserved_quantity || 0))
    : product.availableStock !== undefined
      ? product.availableStock
      : 45;

  const isOutOfStock = availableStock === 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;
  const activePrice = activeVariant?.price_override || product.base_price || 0;

  const handleDecrement = () => {
    if (quantity > 1 && onQuantityChange) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < availableStock && onQuantityChange) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="variant-selector" data-testid="variant-selector">
      {/* 1. Color Variant Selection */}
      {colors.length > 0 && (
        <div className="variant-group">
          <div className="variant-group__header">
            <span className="variant-group__label">Color</span>
            <span className="variant-group__selected-val" data-testid="selected-color-label">
              {selectedColor || colors[0]}
            </span>
          </div>
          <div className="variant-colors" role="radiogroup" aria-label="Available Colors">
            {colors.map((color) => {
              const isSelected = selectedColor?.toLowerCase() === color.toLowerCase();
              const hex = getColorHex(color);
              return (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Select color ${color}`}
                  className={`variant-color-btn ${isSelected ? 'is-selected' : ''}`}
                  data-testid={`color-option-${color.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => onSelectColor && onSelectColor(color)}
                >
                  <span className="variant-color-dot" style={{ backgroundColor: hex }} />
                  <span>{color}</span>
                  {isSelected && <Check size={12} style={{ marginLeft: 2 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Size Variant Selection */}
      {sizes.length > 0 && (
        <div className="variant-group">
          <div className="variant-group__header">
            <span className="variant-group__label">Size</span>
            <span className="variant-group__selected-val" data-testid="selected-size-label">
              {selectedSize || sizes[0]}
            </span>
          </div>
          <div className="variant-sizes" role="radiogroup" aria-label="Available Sizes">
            {sizes.map((size) => {
              const isSelected = selectedSize?.toUpperCase() === size.toUpperCase();
              // Check if this specific size variant is out of stock in currently selected color
              const matchingVar = variants.find(
                (v) =>
                  (!selectedColor || v.color?.toLowerCase() === selectedColor?.toLowerCase()) &&
                  v.size?.toUpperCase() === size.toUpperCase()
              );
              const sizeStock = matchingVar
                ? Math.max(
                    0,
                    (matchingVar.stock_quantity || 0) - (matchingVar.reserved_quantity || 0)
                  )
                : 1;
              const sizeOutOfStock = matchingVar && sizeStock === 0;

              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Select size ${size}${sizeOutOfStock ? ' (Out of stock)' : ''}`}
                  className={`variant-size-btn ${isSelected ? 'is-selected' : ''} ${sizeOutOfStock ? 'is-out-of-stock' : ''}`}
                  data-testid={`size-option-${size.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => onSelectSize && onSelectSize(size)}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SKU & Live Real-Time Stock Status */}
      <div className="variant-telemetry-bar">
        <div className="variant-sku-box">
          <span>Active SKU:</span>
          <span className="variant-sku-code" data-testid="pdp-sku">
            {activeVariant?.sku || 'MS-BAT-001-BLU-M'}
          </span>
        </div>

        <div className="variant-stock-status">
          {isOutOfStock ? (
            <span
              className="variant-stock-badge variant-stock-badge--out-of-stock"
              data-testid="pdp-stock-badge"
            >
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span
              className="variant-stock-badge variant-stock-badge--low-stock"
              data-testid="pdp-stock-badge"
            >
              Low Stock (Only {availableStock} left!)
            </span>
          ) : (
            <span
              className="variant-stock-badge variant-stock-badge--in-stock"
              data-testid="pdp-stock-badge"
            >
              In Stock ({availableStock} available)
            </span>
          )}
        </div>
      </div>

      {/* 4. Price & Quantity Stepper */}
      <div className="variant-purchase-row">
        <div className="variant-price-display">
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Price (LKR)
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--color-primary)',
            }}
            data-testid="pdp-price"
          >
            {formatLKR(activePrice)}
          </div>
        </div>

        {/* Quantity Stepper */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Quantity
          </span>
          <div className="variant-quantity-control">
            <button
              type="button"
              className="variant-qty-btn"
              onClick={handleDecrement}
              disabled={quantity <= 1 || isOutOfStock}
              aria-label="Decrease quantity"
              data-testid="qty-decrement-btn"
            >
              <Minus size={14} />
            </button>
            <span className="variant-qty-val" data-testid="pdp-quantity-val">
              {quantity}
            </span>
            <button
              type="button"
              className="variant-qty-btn"
              onClick={handleIncrement}
              disabled={quantity >= availableStock || isOutOfStock}
              aria-label="Increase quantity"
              data-testid="qty-increment-btn"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Purchase & Action CTA Buttons */}
      <div className="variant-actions">
        {isOutOfStock ? (
          <button
            type="button"
            className="variant-cta-btn variant-cta-btn--notify"
            onClick={onNotifyMe}
            data-testid="notify-me-btn"
          >
            <Bell size={18} />
            <span>Notify Me When Available</span>
          </button>
        ) : null}

        <button
          type="button"
          className="variant-cta-btn variant-cta-btn--primary"
          onClick={() => onAddToCart && onAddToCart(product, activeVariant, quantity)}
          disabled={isOutOfStock}
          data-testid="add-to-cart-btn"
        >
          <ShoppingBag size={18} />
          <span>{isOutOfStock ? 'Out of Stock' : 'Add to Shopping Cart'}</span>
        </button>

        {!isOutOfStock && onReserveStock && (
          <button
            type="button"
            className="variant-cta-btn variant-cta-btn--reserve"
            onClick={() => onReserveStock(product, activeVariant)}
            data-testid="reserve-stock-btn"
          >
            <Shield size={18} />
            <span>Lock Stock (15-Min Reservation)</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default VariantSelector;
