import { formatPrice } from '../../lib/format';

export function Price({ amount, className = '' }) {
  return <span className={`price ${className}`.trim()}>{formatPrice(amount)}</span>;
}
