const LKR = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  currencyDisplay: 'code',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 4500 -> "LKR 4,500"; 4500.5 -> "LKR 4,500.5". Non-numbers render as an em dash. */
export const formatPrice = (amount) => {
  const value = Number(amount);
  if (amount === null || amount === undefined || Number.isNaN(value)) return '—';
  return LKR.format(value).replace(/\u00a0/g, ' ');
};

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? DATE.format(date) : '—';
};

const ORDER_STATUS_LABELS = {
  payment_pending: 'Awaiting payment',
  confirmed: 'Confirmed',
  processing: 'Being prepared',
  shipped: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return requested',
  returned: 'Returned',
};

export const formatOrderStatus = (status) => ORDER_STATUS_LABELS[status] || status || 'Unknown';

/** "mm:ss" for the reservation countdown. */
export const formatCountdown = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};
