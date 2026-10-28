import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../api/orders';
import { useAuth } from '../state/AuthContext';
import { useResource } from '../hooks/useResource';
import { formatDate, formatOrderStatus } from '../lib/format';
import { LoadingState, ErrorState } from '../components/ui/States';
import { OrderItems } from '../components/orders/OrderItems';
import { OrderTotals } from '../components/orders/OrderTotals';
import { formatAddressLines } from '../components/checkout/AddressFields';
import { InvoiceButton } from '../components/orders/InvoiceButton';
import NotFoundPage from './NotFoundPage';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { isSignedIn, status } = useAuth();
  const order = useResource(
    () => (status === 'checking' ? new Promise(() => {}) : getOrder(orderId)),
    [orderId, status]
  );

  useEffect(() => {
    document.title = 'Order placed | Dickwella Fashion Corner';
  }, []);

  if (order.loading) return <LoadingState label="Loading your order" />;
  if (order.error?.status === 404) return <NotFoundPage />;
  if (order.error) {
    return (
      <div className="container page">
        <ErrorState error={order.error} onRetry={order.reload} />
      </div>
    );
  }

  if (!order.data) return <NotFoundPage />;

  const { data } = order;
  const pickup = data.shipping_option === 'pickup';
  const unpaid = data.status === 'payment_pending';
  return (
    <div className="container page confirmation">
      <section className="confirmation__banner" aria-labelledby="confirmation-title">
        <svg className="confirmation__tick" viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" />
          <path d="M15 27l7 7 15-16" />
        </svg>
        <div>
          <h1 id="confirmation-title">Thank you, your order is placed</h1>
          <p className="confirmation__lede">
            Order <strong>{data.invoice_number}</strong> on {formatDate(data.order_date)}. Status:{' '}
            {formatOrderStatus(data.status)}.
            {data.guest_email &&
              ` We have saved ${data.guest_email} as the contact for this order.`}
          </p>
          <div className="confirmation__actions">
            <InvoiceButton order={data} className="btn btn--gold" />
          </div>
        </div>
      </section>
      <ol className="confirmation__next" aria-label="What happens next">
        <li>
          <strong>{unpaid ? 'Waiting for payment' : 'Payment received'}</strong>
          <span>
            {unpaid
              ? 'We send the order once the payment goes through.'
              : 'Your invoice is ready to download.'}
          </span>
        </li>
        <li>
          <strong>We prepare your order</strong>
          <span>Folded and packed at the shop in Dickwella.</span>
        </li>
        <li>
          <strong>{pickup ? 'Ready to collect' : 'On its way'}</strong>
          <span>
            {pickup
              ? 'We will tell you when it is ready at the shop.'
              : 'You get a courier tracking number once it ships.'}
          </span>
        </li>
      </ol>
      <div className="confirmation__grid">
        <section aria-labelledby="items-heading">
          <h2 id="items-heading">Items</h2>
          <OrderItems items={data.items} />
          <OrderTotals order={data} />
        </section>
        <section aria-labelledby="delivery-heading">
          <h2 id="delivery-heading">{pickup ? 'Collection' : 'Delivery'}</h2>
          {pickup ? (
            <p>
              Collect from the shop on Main Street, Dickwella. We will tell you when it is ready.
            </p>
          ) : (
            <address>
              {formatAddressLines(data.shipping_address).map((lineText) => (
                <span key={lineText}>{lineText}</span>
              ))}
            </address>
          )}
          <div className="confirmation__actions">
            {isSignedIn ? (
              <Link to={`/account/orders/${data.id}`} className="btn btn--primary">
                Track this order
              </Link>
            ) : (
              <Link to="/register" className="btn btn--primary">
                Create an account to track orders
              </Link>
            )}
            <Link to="/shop" className="btn btn--ghost">
              Continue shopping
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
