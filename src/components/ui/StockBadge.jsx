import { stockStatus } from '../../lib/stock';

/** FR003 label: In stock / Only X left / Out of stock. */
export function StockBadge({ available }) {
  const { tone, label } = stockStatus(available);
  return <span className={`stock stock--${tone}`}>{label}</span>;
}
