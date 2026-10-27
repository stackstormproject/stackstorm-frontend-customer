import { Price } from '../ui/Price';

/**
 * Lines plus totals. Before the order exists the delivery fee is an estimate using the same
 * rule as the server; after POST /checkout/initiate the server breakdown is shown.
 */
export function OrderSummary({ items, breakdown, estimate }) {
  const totals = breakdown || estimate;
  return (
    <aside className="order-summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Order summary</h2>
      <ul className="order-summary__lines">
        {items.map((item) => (
          <li key={item.id ?? item.variant_id ?? item.variantId}>
            <span>
              {item.product?.name || item.title} <span className="muted">× {item.quantity}</span>
              {(item.size || item.color) && (
                <span className="muted order-summary__variant">
                  {[item.size, item.color].filter(Boolean).join(', ')}
                </span>
              )}
            </span>
            <Price amount={item.line_total ?? item.subtotal} />
          </li>
        ))}
      </ul>
      <dl className="order-summary__totals">
        <dt>Subtotal</dt>
        <dd>
          <Price amount={totals.subtotal} />
        </dd>
        <dt>Delivery{breakdown ? '' : ' (estimate)'}</dt>
        <dd>
          {Number(totals.shipping_fee) === 0 ? 'Free' : <Price amount={totals.shipping_fee} />}
        </dd>
        {Number(totals.discount_amount) > 0 && (
          <>
            <dt>Discount</dt>
            <dd>
              −<Price amount={totals.discount_amount} />
            </dd>
          </>
        )}
        <dt className="order-summary__total">Total</dt>
        <dd className="order-summary__total">
          <Price amount={totals.total_amount} />
        </dd>
      </dl>
    </aside>
  );
}
