import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, trackOrder } from '../../api/orders';
import { listMyReturns } from '../../api/returns';
import { useResource } from '../../hooks/useResource';
import { useToast } from '../../state/ToastContext';
import { formatDate, formatOrderStatus } from '../../lib/format';
import { returnEligibility } from '../../lib/returns';
import { OrderItems } from '../../components/orders/OrderItems';
import { OrderTotals } from '../../components/orders/OrderTotals';
import { TrackingTimeline } from '../../components/account/TrackingTimeline';
import { ReturnDialog } from '../../components/account/ReturnDialog';
import { ReturnProgress } from '../../components/account/ReturnProgress';
import { InvoiceButton } from '../../components/orders/InvoiceButton';
import { formatAddressLines } from '../../components/checkout/AddressFields';
import { LoadingState, ErrorState } from '../../components/ui/States';
import NotFoundPage from '../NotFoundPage';

const loadOrderView = async (orderId) => {
  const [order, tracking, returns] = await Promise.all([
    getOrder(orderId),
    trackOrder(orderId),
    listMyReturns().catch(() => ({ returns: [] })),
  ]);
  return { order, tracking, returns: returns?.returns || [] };
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const toast = useToast();
  const view = useResource(() => loadOrderView(orderId), [orderId]);
  const [returning, setReturning] = useState(null);

  if (view.loading) return <LoadingState label="Loading order" />;
  if (view.error?.status === 404) return <NotFoundPage />;
  if (view.error) return <ErrorState error={view.error} onRetry={view.reload} />;

  const { order, tracking, returns } = view.data;
  const delivered = order.status === 'delivered';

  const renderAction = (item) => {
    const { eligible, reason } = returnEligibility(order, item, returns);
    const request = returns.find((r) => r.order_item_id === item.id);
    return (
      <div className="order-item__actions">
        {request && <ReturnProgress request={request} />}
        {eligible && (
          <button type="button" className="btn--link" onClick={() => setReturning(item)}>
            Return or exchange
          </button>
        )}
        {reason && !request && <span className="muted">{reason}</span>}
        {delivered && item.product_slug && (
          <Link to={`/products/${item.product_slug}#reviews-heading`}>Write a review</Link>
        )}
      </div>
    );
  };

  return (
    <article aria-labelledby="order-heading">
      <p>
        <Link to="/account/orders">All orders</Link>
      </p>
      <h2 id="order-heading">Order {order.invoice_number}</h2>
      <div className="order-detail__head">
        <p className="muted">
          Placed {formatDate(order.order_date)} · {formatOrderStatus(order.status)}
        </p>
        <InvoiceButton order={order} />
      </div>
      {order.status === 'payment_pending' && (
        <p className="form-error">
          This order was not paid, so it will not be sent. Place a new order to buy these items.
        </p>
      )}
      <div className="order-detail">
        <section aria-labelledby="order-items-heading">
          <h3 id="order-items-heading">Items</h3>
          <OrderItems items={order.items} renderAction={renderAction} />
          <OrderTotals order={order} />
        </section>
        <div>
          <TrackingTimeline tracking={tracking} trackingNumber={order.tracking_number} />
          <section aria-labelledby="ship-heading">
            <h3 id="ship-heading">
              {order.shipping_option === 'pickup' ? 'Collection' : 'Delivery address'}
            </h3>
            {order.shipping_option === 'pickup' ? (
              <p>Main Street, Dickwella</p>
            ) : (
              <address>
                {formatAddressLines(order.shipping_address).map((lineText) => (
                  <span key={lineText}>{lineText}</span>
                ))}
              </address>
            )}
          </section>
        </div>
      </div>
      {returning && (
        <ReturnDialog
          item={returning}
          onClose={() => setReturning(null)}
          onRequested={(type) => {
            setReturning(null);
            toast.success(
              type === 'exchange'
                ? 'Exchange requested. Follow its progress under Returns.'
                : 'Return requested. Follow its progress under Returns.'
            );
            view.reload();
          }}
        />
      )}
    </article>
  );
}
