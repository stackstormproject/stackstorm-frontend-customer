export const LOW_STOCK_THRESHOLD = 5;

/** Units a shopper can buy now: physical stock minus active 15-minute holds. */
export const availableOf = (variant) => {
  if (!variant) return 0;
  if (variant.available_stock !== undefined) return Math.max(0, Number(variant.available_stock));
  const stock = Number(variant.stock_quantity ?? variant.stockQuantity ?? 0);
  const reserved = Number(variant.reserved_quantity ?? variant.reservedQuantity ?? 0);
  return Math.max(0, stock - reserved);
};

/**
 * FR003 status labels: In stock / Only X left / Out of stock.
 * @returns {{ tone: 'ok'|'low'|'out', label: string }}
 */
export const stockStatus = (available) => {
  if (available <= 0) return { tone: 'out', label: 'Out of stock' };
  if (available <= LOW_STOCK_THRESHOLD) return { tone: 'low', label: `Only ${available} left` };
  return { tone: 'ok', label: 'In stock' };
};

/** Total units across all variants of a product (catalog cards). */
export const productAvailability = (product) =>
  (product?.variants || []).reduce((sum, variant) => sum + availableOf(variant), 0);

/** Price of a specific variant: product price plus the variant surcharge (server rule). */
export const variantPrice = (product, variant) =>
  Number(product?.price || 0) + Number(variant?.additionalPrice ?? variant?.additional_price ?? 0);
