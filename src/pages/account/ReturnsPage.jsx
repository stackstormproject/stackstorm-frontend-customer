import { Link } from 'react-router-dom';
import { listMyReturns } from '../../api/returns';
import { useResource } from '../../hooks/useResource';
import { formatDate } from '../../lib/format';
import { RETURN_STATUS_LABELS as RETURN_STATUS } from '../../lib/returns';
import { Price } from '../../components/ui/Price';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/States';

export default function ReturnsPage() {
  const returns = useResource(listMyReturns, []);
  if (returns.loading) return <LoadingState label="Loading returns" />;
  if (returns.error) return <ErrorState error={returns.error} onRetry={returns.reload} />;
  const list = returns.data?.returns || [];
  if (!list.length) {
    return (
      <EmptyState
        title="No returns"
        action={
          <Link to="/account/orders" className="btn btn--secondary">
            Go to your orders
          </Link>
        }
      >
        Start a return from a delivered order within 30 days of delivery.
      </EmptyState>
    );
  }
  return (
    <section aria-labelledby="returns-heading">
      <h2 id="returns-heading">Returns and exchanges</h2>
      <ul className="order-list">
        {list.map((item) => (
          <li key={item.id} className="return-row">
            <div>
              <strong>{item.product_title}</strong>
              <Link to={`/account/orders/${item.order_id}`} className="return-row__order">
                View order
              </Link>
              <p className="muted">
                {item.type === 'exchange' ? 'Exchange' : 'Refund'} · {formatDate(item.created_at)} ·{' '}
                {item.reason}
              </p>
            </div>
            <span className={`status status--${item.status}`}>
              {RETURN_STATUS[item.status] || item.status}
            </span>
            {item.type === 'return' && Number(item.refund_amount) > 0 && (
              <Price amount={item.refund_amount} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
