import { useMemo, useState } from 'react';
import { Price } from '../ui/Price';
import { StockBadge } from '../ui/StockBadge';
import { QuantityStepper } from './QuantityStepper';
import { WishlistButton } from '../catalog/WishlistButton';
import { availableOf, variantPrice } from '../../lib/stock';
import { sortSizes } from '../../lib/catalogQuery';
import { useCart } from '../../state/CartContext';
import { useToast } from '../../state/ToastContext';

const MAX_PER_LINE = 10; // reservation.service MAX_QUANTITY_PER_ITEM

/**
 * Size (and colour, when there is more than one) selection, live price for the chosen
 * variant, stock label and add to bag. Sold-out sizes stay visible but cannot be chosen.
 */
export function BuyBox({ product }) {
  const { addItem, openCart } = useCart();
  const toast = useToast();
  const variants = product.variants || [];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const firstInStock = variants.find((v) => availableOf(v) > 0)?.color;
  const [color, setColor] = useState(firstInStock || colors[0] || null);
  const inColor = variants.filter((v) => !color || v.color === color);
  const sizes = sortSizes(inColor.map((v) => v.size));
  const onlyOne = inColor.length === 1 ? inColor[0] : null;
  const [size, setSize] = useState(onlyOne && availableOf(onlyOne) > 0 ? onlyOne.size : null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const selected = useMemo(() => inColor.find((v) => v.size === size) || null, [inColor, size]);
  const available = selected ? availableOf(selected) : null;
  const maxQuantity = Math.max(1, Math.min(available ?? 1, MAX_PER_LINE));
  const soldOut = variants.every((v) => availableOf(v) === 0);

  const chooseSize = (nextSize) => {
    setSize(nextSize);
    setQuantity(1);
    setError(null);
  };

  const add = async () => {
    if (!selected) {
      setError('Choose a size first.');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      await addItem(selected.id, quantity);
      toast.success(`Added ${product.name} (${selected.size}) to your bag`);
      openCart();
    } catch (err) {
      setError(
        err.status === 409
          ? `Only ${available} left in ${selected.size}, and some may already be in your bag.`
          : err.message
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="buy-box">
      <p className="buy-box__price">
        <Price amount={selected ? variantPrice(product, selected) : product.price} />
      </p>

      {colors.length > 1 && (
        <fieldset className="option-group">
          <legend>Colour</legend>
          <div className="chips">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${c === color ? 'is-selected' : ''}`}
                aria-pressed={c === color}
                onClick={() => {
                  setColor(c);
                  chooseSize(null);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset className="option-group">
          <legend>
            Size
            {selected && <span className="option-group__value">{selected.size}</span>}
          </legend>
          <div className="chips">
            {sizes.map((s) => {
              const variant = inColor.find((v) => v.size === s);
              const out = availableOf(variant) === 0;
              const surcharge = Number(variant.additionalPrice || 0);
              return (
                <button
                  key={s}
                  type="button"
                  className={`chip ${s === size ? 'is-selected' : ''}`}
                  aria-pressed={s === size}
                  aria-label={out ? `${s}, sold out` : s}
                  disabled={out}
                  onClick={() => chooseSize(s)}
                >
                  {s}
                  {surcharge > 0 && !out && <span className="chip__extra">+{surcharge}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {selected && <StockBadge available={available} />}

      {!soldOut && (
        <div className="buy-box__actions">
          <QuantityStepper
            value={quantity}
            max={maxQuantity}
            onChange={setQuantity}
            disabled={!selected}
          />
          <button
            type="button"
            className="btn btn--primary buy-box__add"
            onClick={add}
            disabled={adding}
          >
            {adding ? 'Adding…' : 'Add to bag'}
          </button>
        </div>
      )}
      {soldOut && <p className="buy-box__soldout">Sold out in every size.</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <WishlistButton productId={product.id} productName={product.name} variant="text" />
    </div>
  );
}
