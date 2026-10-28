import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { formatPrice } from '../lib/format';

/**
 * Stands in for the hosted payment page when no Stripe key is set (development and CI only;
 * the backend never offers it in production). It is labelled as a test everywhere, takes no
 * card details, and returns to the shop exactly as Stripe Checkout would (#182).
 */
export default function TestGatewayPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const orderId = params.get('order');
  const sessionId = params.get('session_id');
  const amount = Number(params.get('amount'));
  const back = `/checkout/complete?order=${encodeURIComponent(orderId || '')}`;

  useEffect(() => {
    document.title = 'Test payment gateway';
  }, []);

  const pay = () => {
    setPaying(true);
    // Mimic the gateway's own processing pause before it sends the shopper back.
    setTimeout(() => navigate(`${back}&session_id=${encodeURIComponent(sessionId || '')}`), 900);
  };

  return (
    <main className="gateway">
      <div className="gateway__panel">
        <p className="gateway__badge">Test mode: no real payment is taken</p>
        <h1>Test payment gateway</h1>
        <p className="gateway__merchant">Paying Dickwella Fashion Corner</p>
        <p className="gateway__amount">{Number.isFinite(amount) ? formatPrice(amount) : ''}</p>
        <dl className="gateway__card">
          <div>
            <dt>Card</dt>
            <dd>Test card ending 4242</dd>
          </div>
          <div>
            <dt>Order</dt>
            <dd>#{orderId}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={pay}
          disabled={paying || !orderId || !sessionId}
        >
          <Lock size={16} aria-hidden="true" />
          {paying ? 'Processing…' : `Pay ${formatPrice(amount)}`}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--block"
          disabled={paying}
          onClick={() => navigate(`${back}&cancelled=1`)}
        >
          Cancel and return to the shop
        </button>
        <p className="gateway__note">
          With a Stripe key on the backend this page is Stripe&apos;s secure checkout instead.
        </p>
      </div>
    </main>
  );
}
