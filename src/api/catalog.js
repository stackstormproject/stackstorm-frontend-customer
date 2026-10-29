import { http } from '../lib/http';

export const PAGE_SIZE = 12;
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

/** Drops empty values so the URL and the request only carry real filters. */
const compact = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );

/**
 * GET /products - server-side filtering, sorting and pagination (FR001, FR002).
 * @param {{category?: string, search?: string, size?: string, color?: string,
 *   minPrice?: number, maxPrice?: number, sort?: string, page?: number,
 *   section?: 'new_arrivals'|'popular', brand?: string, limit?: number}} filters
 */
export const listProducts = (filters = {}) =>
  http.get('/products', {
    params: compact({
      category: filters.category,
      search: filters.search,
      size: filters.size,
      color: filters.color,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      sort: filters.sort,
      section: filters.section,
      brand: filters.brand,
      page: filters.page || 1,
      limit: filters.limit || PAGE_SIZE,
    }),
  });

/**
 * GET /products/suggest - products, categories and brands matching the typed text (#191,
 * FR-001). Fewer than 2 characters returns empty lists from the server.
 */
export const suggestProducts = (q, { signal } = {}) =>
  http.get('/products/suggest', { params: { q }, signal });

/** GET /products/facets - in-stock colours and sizes for the shop's filters (#191, FR-002). */
export const getFacets = () => http.get('/products/facets');

/** GET /brands - featured brands with products on sale, for "Our brands" (#176). */
export const listBrands = () => http.get('/brands');

/** GET /products/:slug - full product with variants, images and review summary (FR003, FR004). */
export const getProduct = (slug) => http.get(`/products/${encodeURIComponent(slug)}`);

/** GET /categories - nested category tree for navigation. */
export const listCategories = () => http.get('/categories');

/** GET /products/:id/reviews - reviews with rating breakdown (FR008). */
export const listReviews = (productId, page = 1) =>
  http.get(`/products/${productId}/reviews`, { params: { page } });

/** POST /products/:id/reviews - verified purchasers only; the server enforces it. */
export const createReview = (productId, { rating, comment }) =>
  http.post(`/products/${productId}/reviews`, { rating, comment });
