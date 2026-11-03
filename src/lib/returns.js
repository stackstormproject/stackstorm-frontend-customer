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

/** Shopper-facing words for a return's status (#177). */
export const RETURN_STATUS_LABELS = {
  requested: 'Waiting for review',
  approved: 'Approved: send the item back',
  rejected: 'Not accepted',
  completed: 'Completed',
};

/**
 * Steps of a return for a progress line: requested -> approved -> completed, or a final
 * "Not accepted" step when the shop rejects it (at review or after inspecting the parcel).
 * @returns {{ label: string, state: 'done'|'current'|'todo'|'rejected' }[]}
 */
export const returnSteps = (status, type = 'return') => {
  const finalLabel = type === 'exchange' ? 'New size sent' : 'Refunded';
  if (status === 'rejected') {
    return [
      { label: 'Requested', state: 'done' },
      { label: 'Not accepted', state: 'rejected' },
    ];
  }
  const order = ['requested', 'approved', 'completed'];
  const reached = Math.max(0, order.indexOf(status));
  return [
    { label: 'Requested', key: 'requested' },
    { label: 'Approved, item on its way back', key: 'approved' },
    { label: finalLabel, key: 'completed' },
  ].map((step, i) => {
    let state = 'todo';
    if (i < reached || (i === reached && status === 'completed')) state = 'done';
    else if (i === reached) state = 'current';
    return { label: step.label, state };
  });
};
