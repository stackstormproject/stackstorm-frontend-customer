import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { availableOf } from '../../lib/stock';
import { sortSizes } from '../../lib/catalogQuery';
import { useCart } from '../../state/CartContext';
import { useToast } from '../../state/ToastContext';

/**
 * "Add to bag" and "Buy now" on a product card (#176). A product with one size in stock is
 * added straight away; otherwise the shopper picks a size first, right on the card.
 */
export function QuickBuy({ product }) {
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const toast = useToast();
  const [mode, setMode] = useState(null); // 'add' | 'buy' while choosing a size
  const [busy, setBusy] = useState(false);

  const inStock = (product.variants || []).filter((v) => availableOf(v) > 0);
  const sizes = sortSizes(inStock.map((v) => v.size));

  if (!inStock.length) return <p className="quick-buy__soldout">Sold out</p>;

  const buy = async (variant, action) => {
    setBusy(true);
    try {
      await addItem(variant.id, 1);
      setMode(null);
      if (action === 'buy') {
        navigate('/checkout');
      } else {
        toast.success(
          `Added ${product.name}${variant.size ? ` (${variant.size})` : ''} to your bag`
        );
        openCart();
      }
    } catch (err) {
      toast.error(
        err.status === 409 ? `${product.name} in ${variant.size} has just sold out.` : err.message
      );
    } finally {
      setBusy(false);
    }
  };

  const start = (action) => {
    if (inStock.length === 1) buy(inStock[0], action);
    else setMode(action);
  };

  if (mode) {
    return (
      <fieldset className="quick-buy quick-buy--sizes">
        <legend>{mode === 'buy' ? 'Choose a size to buy' : 'Choose a size'}</legend>
        <div className="chips">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className="chip"
              disabled={busy}
              onClick={() =>
                buy(
                  inStock.find((v) => v.size === size),
                  mode
                )
              }
            >
              {size}
            </button>
          ))}
          <button
            type="button"
            className="btn--link quick-buy__cancel"
            onClick={() => setMode(null)}
          >
            Cancel
          </button>
        </div>
      </fieldset>
    );
  }

  return (
    <div className="quick-buy">
      <button
        type="button"
        className="btn btn--secondary quick-buy__button"
        disabled={busy}
        aria-label={`Add ${product.name} to bag`}
        onClick={() => start('add')}
      >
        Add to bag
      </button>
      <button
        type="button"
        className="btn btn--primary quick-buy__button"
        disabled={busy}
        aria-label={`Buy ${product.name} now`}
        onClick={() => start('buy')}
      >
        Buy now
      </button>
    </div>
  );
}
