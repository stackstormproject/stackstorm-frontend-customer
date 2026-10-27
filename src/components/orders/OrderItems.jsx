import { Link } from 'react-router-dom';
import { Price } from '../ui/Price';

/** Order lines as returned by GET /orders/:id. `renderAction` adds per-line actions. */
export function OrderItems({ items, renderAction }) {
  return (
    <ul className="order-items">
      {items.map((item) => (
        <li key={item.id} className="order-item">
          <div className="order-item__media">
            {item.primary_image && <img src={item.primary_image} alt="" />}
          </div>
          <div className="order-item__body">
            {item.product_slug ? (
              <Link to={`/products/${item.product_slug}`}>{item.product_title}</Link>
            ) : (
              <span>{item.product_title}</span>
            )}
            <p className="muted">
              {[item.size, item.color].filter(Boolean).join(', ')} · Qty {item.quantity}
            </p>
            {renderAction?.(item)}
          </div>
          <Price amount={item.subtotal} />
        </li>
      ))}
    </ul>
  );
}
