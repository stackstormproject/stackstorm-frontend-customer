import { http } from '../lib/http';

export const RETURN_REASONS = [
  'Wrong size',
  'Not as described',
  'Arrived damaged',
  'Changed my mind',
  'Other',
];

/**
 * POST /returns (FR023). The server enforces the business rules: delivered orders only,
 * within 30 days of delivery, never final-sale items, one request per item.
 */
export const requestReturn = ({ orderItemId, type, reason, exchangeVariantId }) =>
  http.post('/returns', {
    order_item_id: orderItemId,
    type,
    reason,
    exchange_variant_id: type === 'exchange' ? exchangeVariantId : undefined,
  });

export const listMyReturns = () => http.get('/returns/my-returns');
