import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyOrders } from '../../api/orders';
import { listMyReturns } from '../../api/returns';
import { useResource } from '../../hooks/useResource';
import { formatDate, formatOrderStatus, ORDER_REFRESH_MS } from '../../lib/format';
import { Price } from '../../components/ui/Price';
import { Pagination } from '../../components/catalog/Pagination';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';

/** FR009 order history. */
export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const orders = useResource(() => listMyOrders(page), [page], { refreshEvery: ORDER_REFRESH_MS });
  // Returns are shown on the order they belong to (#177); failing to load them hides only that.
  const returns = useResource(() => listMyReturns().catch(() => null), []);
  const returnsByOrder = (returns.data?.returns || []).reduce((map, r) => {
    map.set(r.order_id, [...(map.get(r.order_id) || []), r]);
    return map;
  }, new Map());
  const returnLabel = (orderId) => {
    const list = returnsByOrder.get(orderId);
    if (!list) return null;
    const open = list.filter((r) => ['requested', 'approved'].includes(r.status)).length;
    if (open) return `${open} ${open === 1 ? 'return' : 'returns'} in progress`;
    return list.length === 1 ? 'Return closed' : 'Returns closed';
  };

  if (orders.loading) return <LoadingState label="Loading your orders" />;
  if (orders.error) return <ErrorState error={orders.error} onRetry={orders.reload} />;
  if (!orders.data.orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        action={
          <Link to="/shop" className="btn btn--secondary">
            Start shopping
          </Link>
        }
      />
    );
  }
  return (
    <section aria-labelledby="orders-heading">
      <h2 id="orders-heading">Your orders</h2>
      <ul className="order-list">
        {orders.data.orders.map((order) => (
          <li key={order.id}>
            <Link to={`/account/orders/${order.id}`} className="order-row">
              <span className="order-row__id">{order.invoice_number}</span>
              <span className="muted">{formatDate(order.order_date)}</span>
              <span className={`status status--${order.status}`}>
                {formatOrderStatus(order.status)}
              </span>
              <span className="muted">
                {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
              </span>
              <Price amount={order.total_amount} />
              {returnLabel(order.id) && (
                <span className="order-row__return">{returnLabel(order.id)}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={orders.data.pagination?.total_pages} onChange={setPage} />
    </section>
  );
}
