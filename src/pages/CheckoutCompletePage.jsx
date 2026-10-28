import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmCheckoutSession, createCheckoutSession, paymentPageFor } from '../api/checkout';
import { getOrder } from '../api/orders';
import { removeCartItem } from '../api/cart';
import { useAuth } from '../state/AuthContext';
import { useCart } from '../state/CartContext';
import { leaveFor } from '../lib/redirect';
import { LoadingState } from '../components/ui/States';

/**
 * Where the payment page sends the shopper back (#182): verifies the payment with the
 * server, takes the bought items out of the bag and opens the order confirmation. A cancelled
 * or failed payment can be tried again while the order is still waiting for payment.
 */
export default function CheckoutCompletePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { status } = useAuth();
  const { items, refresh, loadState } = useCart();
  const orderId = Number(params.get('order'));
  const sessionId = params.get('session_id');
  const cancelled = params.get('cancelled') === '1' || !sessionId;
  const [problem, setProblem] = useState(cancelled ? 'cancelled' : null);
  const [retrying, setRetrying] = useState(false);
  const started = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    document.title = 'Payment | Dickwella Fashion Corner';
  }, []);

  useEffect(() => {
    // Wait until a returning customer's session and bag are loaded, then verify once.
    const loading = status === 'checking' || loadState === 'idle' || loadState === 'loading';
    if (cancelled || loading || started.current || !orderId) return;
    started.current = true;
    (async () => {
      try {
        await confirmCheckoutSession(orderId, sessionId);
        const order = await getOrder(orderId).catch(() => null);
        const bought = new Set((order?.items || []).map((line) => line.variant_id));
        await Promise.allSettled(
          itemsRef.current
            .filter((item) => !order || bought.has(item.variant_id))
            .map((item) => removeCartItem(item.id))
        );
        refresh().catch(() => {});
        navigate(`/orders/${orderId}/confirmation`, { replace: true });
      } catch (err) {
        setProblem(err.message || 'failed');
      }
    })();
  }, [cancelled, status, loadState, orderId, sessionId, navigate, refresh]);

  const tryAgain = async () => {
    setRetrying(true);
    try {
      const session = await createCheckoutSession(orderId);
      const target = paymentPageFor(orderId, session);
      if (target.route) navigate(target.route);
      else leaveFor(target.href);
    } catch (err) {
      setProblem(
        err.status === 409
          ? 'This order can no longer be paid. Place a new order from your bag.'
          : err.message
      );
      setRetrying(false);
    }
  };

  if (!orderId) {
    return (
      <div className="container page">
        <h1>Payment</h1>
        <p>We could not tell which order this payment was for.</p>
        <Link to="/cart" className="btn btn--secondary">
          Back to your bag
        </Link>
      </div>
    );
  }

  if (!problem) return <LoadingState label="Confirming your payment" />;

  return (
    <div className="container page payment-result">
      <h1>{problem === 'cancelled' ? 'Payment cancelled' : 'Payment not completed'}</h1>
      <p className={problem === 'cancelled' ? '' : 'form-error'} role="alert">
        {problem === 'cancelled'
          ? 'No money was taken. Your items stay held for a short while, so you can try again.'
          : problem}
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={tryAgain} disabled={retrying}>
          {retrying ? 'Opening the payment page…' : 'Try paying again'}
        </button>
        <Link to="/cart" className="btn btn--ghost">
          Back to your bag
        </Link>
      </div>
    </div>
  );
}
