import { Price } from '../ui/Price';

export function OrderTotals({ order }) {
  const subtotal = (order.items || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  return (
    <dl className="order-summary__totals">
      <dt>Subtotal</dt>
      <dd>
        <Price amount={subtotal} />
      </dd>
      <dt>Delivery</dt>
      <dd>{Number(order.shipping_cost) === 0 ? 'Free' : <Price amount={order.shipping_cost} />}</dd>
      {Number(order.discount_amount) > 0 && (
        <>
          <dt>Discount</dt>
          <dd>
            −<Price amount={order.discount_amount} />
          </dd>
        </>
      )}
      <dt className="order-summary__total">Total</dt>
      <dd className="order-summary__total">
        <Price amount={order.total_amount} />
      </dd>
    </dl>
  );
}
