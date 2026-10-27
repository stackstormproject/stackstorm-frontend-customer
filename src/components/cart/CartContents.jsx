import { Link } from 'react-router-dom';
import { useCart } from '../../state/CartContext';
import { CartLine } from './CartLine';
import { CartSummary } from './CartSummary';
import { LoadingState, ErrorState, EmptyState } from '../ui/States';

/** Shared by the drawer and the /cart page. `onNavigate` closes the drawer on link clicks. */
export function CartContents({ onNavigate }) {
  const { items, loadState, refresh } = useCart();

  if (loadState === 'loading' || loadState === 'idle')
    return <LoadingState label="Loading your bag" />;
  if (loadState === 'error') {
    return (
      <ErrorState
        error={{ message: 'Your bag could not be loaded.' }}
        onRetry={() => refresh().catch(() => {})}
      />
    );
  }
  if (!items.length) {
    return (
      <EmptyState
        title="Your bag is empty"
        action={
          <Link to="/shop" className="btn btn--secondary" onClick={onNavigate}>
            Start shopping
          </Link>
        }
      />
    );
  }
  return (
    <>
      <ul className="cart-lines">
        {items.map((item) => (
          <CartLine key={item.id} item={item} onNavigate={onNavigate} />
        ))}
      </ul>
      <CartSummary onCheckout={onNavigate} />
    </>
  );
}
