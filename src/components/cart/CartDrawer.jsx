import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCart } from '../../state/CartContext';
import { useDialog } from '../../hooks/useDialog';
import { CartContents } from './CartContents';

export function CartDrawer() {
  const { isOpen, closeCart, itemCount } = useCart();
  const ref = useDialog(isOpen, closeCart);
  const { pathname } = useLocation();

  // Any navigation closes the drawer.
  useEffect(() => {
    closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!isOpen) return null;
  return (
    <div className="drawer-layer">
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="Close bag"
        tabIndex={-1}
        onClick={closeCart}
      />
      <div
        ref={ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-title"
        tabIndex={-1}
      >
        <div className="drawer__header">
          <h2 id="bag-title">
            Your bag <span className="drawer__count">({itemCount})</span>
          </h2>
          <button type="button" className="icon-button" onClick={closeCart} aria-label="Close bag">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="drawer__body">
          <CartContents onNavigate={closeCart} />
        </div>
      </div>
    </div>
  );
}
