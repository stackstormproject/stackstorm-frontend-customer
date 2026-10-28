import { Link } from 'react-router-dom';
import { Price } from '../ui/Price';
import { formatPrice } from '../../lib/format';
import { useCart, FREE_SHIPPING_THRESHOLD } from '../../state/CartContext';

export function CartSummary({ onCheckout }) {
  const { subtotal, hasUnavailableItems } = useCart();
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="cart-summary">
      <p className="cart-summary__delivery">
        {remaining > 0
          ? `Add ${formatPrice(remaining)} more for free islandwide delivery.`
          : 'Your order qualifies for free islandwide delivery.'}
      </p>
      <div
        className="meter"
        role="progressbar"
        aria-label="Progress to free delivery"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="cart-summary__row">
        <span>Subtotal</span>
        <Price amount={subtotal} />
      </p>
      <p className="cart-summary__note">Delivery is worked out at checkout.</p>
      {hasUnavailableItems ? (
        <button type="button" className="btn btn--primary btn--block" disabled>
          Check out
        </button>
      ) : (
        <Link to="/checkout" className="btn btn--primary btn--block" onClick={onCheckout}>
          Check out
        </Link>
      )}
    </div>
  );
}
