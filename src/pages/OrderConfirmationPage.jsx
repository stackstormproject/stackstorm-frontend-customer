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
  return (
    <div className="container page confirmation">
      <h1>Thank you, your order is placed</h1>
      <p className="confirmation__lede">
        Order <strong>{data.invoice_number}</strong> on {formatDate(data.order_date)}. Status:{' '}
        {formatOrderStatus(data.status)}.
        {data.guest_email && ` We have saved ${data.guest_email} as the contact for this order.`}
      </p>
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
