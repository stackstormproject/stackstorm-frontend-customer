/**
 * Currency and date formatting utilities for StackStorm
 * Dickwella Fashion Corner E-Commerce
 */

/**
 * Format numeric amount into Sri Lankan Rupee currency format (e.g., "LKR 4,850.00")
 * @param {number|string} amount
 * @returns {string} Formatted currency string
 */
export const formatLKR = (amount) => {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numeric)) {
    return 'LKR 0.00';
  }

  const formatted = numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `LKR ${formatted}`;
};

/**
 * Format standard rating value (e.g. 4.8)
 * @param {number} rating
 * @returns {string}
 */
export const formatRating = (rating) => {
  const num = typeof rating === 'number' ? rating : 5.0;
  return (Math.round((num + Number.EPSILON) * 10) / 10).toFixed(1);
};
