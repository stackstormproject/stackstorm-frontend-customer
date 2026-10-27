import { Link } from 'react-router-dom';
import { Price } from '../ui/Price';
import { QuantityStepper } from '../product/QuantityStepper';
import { useCart } from '../../state/CartContext';
import { useToast } from '../../state/ToastContext';

const MAX_PER_LINE = 10;

export function CartLine({ item, onNavigate }) {
  const { updateQuantity, removeItem, pendingItemId } = useCart();
  const toast = useToast();
  const busy = pendingItemId === item.id;
  const name = item.product?.name || item.sku || 'Item';
  const tooMany = item.quantity > item.available_stock;
  const max = Math.max(item.quantity, Math.min(item.available_stock, MAX_PER_LINE));

  const run = async (action, failureMessage) => {
    try {
      await action();
    } catch (error) {
      toast.error(error.status === 409 ? failureMessage : error.message);
    }
  };

  return (
    <li className={`cart-line ${busy ? 'is-busy' : ''}`}>
      <div className="cart-line__media">
        {item.product?.primary_image && <img src={item.product.primary_image} alt="" />}
      </div>
      <div className="cart-line__body">
        <Link
          to={item.product?.slug ? `/products/${item.product.slug}` : '/shop'}
          className="cart-line__name"
          onClick={onNavigate}
        >
          {name}
        </Link>
        <p className="cart-line__variant">
          {[item.size, item.color].filter(Boolean).join(', ')}
          {' · '}
          <Price amount={item.unit_price} />
        </p>
        {tooMany && (
          <p className="cart-line__warning" role="alert">
            {item.available_stock === 0
              ? 'Now sold out. Remove it to check out.'
              : `Only ${item.available_stock} left. Lower the quantity to check out.`}
          </p>
        )}
        <div className="cart-line__controls">
          <QuantityStepper
            label={`Quantity of ${name}`}
            value={item.quantity}
            max={max}
            disabled={busy}
            onChange={(quantity) =>
              quantity < 1
                ? run(() => removeItem(item.id))
                : run(() => updateQuantity(item.id, quantity), `Only ${item.available_stock} left.`)
            }
          />
          <button
            type="button"
            className="btn--link"
            disabled={busy}
            onClick={() => run(() => removeItem(item.id))}
          >
            Remove<span className="visually-hidden"> {name}</span>
          </button>
        </div>
      </div>
      <Price amount={item.line_total} className="cart-line__total" />
    </li>
  );
}
