import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatLKR } from '../../utils/formatters';
import './CartItemRow.css';

/**
 * CartItemRow Component (STORM-FE-009)
 * Represents a single apparel line item in the slide-over cart drawer with thumbnail,
 * size/color variant chips, unit price, debounced quantity stepper, and total.
 */
export function CartItemRow({ item = {}, onUpdateQuantity = null, onRemove = null }) {
  const {
    id,
    title = 'Apparel Item',
    size = 'M',
    color = 'Ocean Blue',
    unit_price = 0,
    quantity = 1,
    subtotal = unit_price * quantity,
    image_url = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    available_stock = 30,
  } = item;

  const handleDecrement = () => {
    if (quantity > 1 && onUpdateQuantity) {
      onUpdateQuantity(id, quantity - 1);
    } else if (quantity === 1 && onRemove) {
      onRemove(id);
    }
  };

  const handleIncrement = () => {
    if (onUpdateQuantity && (!available_stock || quantity < available_stock)) {
      onUpdateQuantity(id, quantity + 1);
    }
  };

  return (
    <div className="cart-item-row" data-testid={`cart-item-${id}`}>
      {/* Thumbnail */}
      <div className="cart-item-row__media">
        <img src={image_url} alt={title} className="cart-item-row__img" loading="lazy" />
      </div>

      {/* Details */}
      <div className="cart-item-row__details">
        <h4 className="cart-item-row__title" title={title}>
          {title}
        </h4>

        {/* Variant Badges */}
        <div className="cart-item-row__variants">
          {size && (
            <span className="cart-item-row__badge" data-testid={`cart-item-size-${id}`}>
              Size: {size}
            </span>
          )}
          {color && (
            <span className="cart-item-row__badge" data-testid={`cart-item-color-${id}`}>
              Color: {color}
            </span>
          )}
        </div>

        {/* Price & Quantity Controls */}
        <div className="cart-item-row__stepper-wrap">
          <div className="cart-item-row__stepper">
            <button
              type="button"
              className="cart-item-row__btn-step"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
              data-testid={`cart-dec-${id}`}
            >
              <Minus size={12} />
            </button>
            <span className="cart-item-row__qty-val" data-testid={`cart-qty-${id}`}>
              {quantity}
            </span>
            <button
              type="button"
              className="cart-item-row__btn-step"
              onClick={handleIncrement}
              disabled={available_stock ? quantity >= available_stock : false}
              aria-label="Increase quantity"
              data-testid={`cart-inc-${id}`}
            >
              <Plus size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="cart-item-row__total-price" data-testid={`cart-item-total-${id}`}>
              {formatLKR(subtotal)}
            </span>

            <button
              type="button"
              className="cart-item-row__btn-remove"
              onClick={() => onRemove && onRemove(id)}
              aria-label={`Remove ${title} from cart`}
              title="Remove item"
              data-testid={`cart-remove-${id}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartItemRow;
