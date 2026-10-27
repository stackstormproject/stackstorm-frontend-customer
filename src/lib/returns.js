// Client-side mirror of the SRS return rules (return.service assertReturnEligible), used only to
// decide whether to offer the return button. The server re-checks every request.

export const RETURN_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @returns {{ eligible: boolean, reason: string|null }}
 */
export const returnEligibility = (order, item, existingReturns = [], now = new Date()) => {
  if (existingReturns.some((r) => r.order_item_id === item.id)) {
    return { eligible: false, reason: 'Return requested' };
  }
  if (item.is_final_sale) return { eligible: false, reason: 'Final sale' };
  if (order.status !== 'delivered') return { eligible: false, reason: null };
  const deliveredAt = new Date(order.delivery_date || order.updated_at || order.order_date);
  if (now.getTime() - deliveredAt.getTime() > RETURN_WINDOW_DAYS * DAY_MS) {
    return { eligible: false, reason: 'Return window closed' };
  }
  return { eligible: true, reason: null };
};
