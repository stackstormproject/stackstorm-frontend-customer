// The catalog state lives in the URL (/shop/:category?search=&size=&price=&sort=&page=),
// so results survive refresh and can be shared. These helpers convert both ways.

export const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'Free Size', 'One Size'];

export const PRICE_BANDS = [
  { value: 'under-3000', label: 'Under LKR 3,000', max: 2999 },
  { value: '3000-6000', label: 'LKR 3,000 to 6,000', min: 3000, max: 6000 },
  { value: '6000-10000', label: 'LKR 6,000 to 10,000', min: 6000, max: 10000 },
  { value: 'over-10000', label: 'Over LKR 10,000', min: 10000 },
];

const DEFAULT_SORT = 'newest';

/** Sizes in wearing order (S before M), unknown sizes last in their original order. */
export const sortSizes = (sizes) =>
  [...new Set(sizes.filter(Boolean))].sort((a, b) => {
    const rank = (size) => {
      const index = SIZE_OPTIONS.indexOf(size);
      return index === -1 ? SIZE_OPTIONS.length : index;
    };
    return rank(a) - rank(b);
  });

/** /categories returns a tree ({ children: [...] }); navigation needs a flat list. */
export const flattenCategories = (tree = []) =>
  tree.flatMap(({ children = [], ...category }) => [category, ...flattenCategories(children)]);

/** URL -> API filters */
export const filtersFromUrl = (category, searchParams) => {
  const band = PRICE_BANDS.find((b) => b.value === searchParams.get('price'));
  const page = Number.parseInt(searchParams.get('page'), 10);
  return {
    category: category || undefined,
    search: searchParams.get('search') || undefined,
    size: searchParams.get('size') || undefined,
    brand: searchParams.get('brand') || undefined,
    minPrice: band?.min,
    maxPrice: band?.max,
    sort: searchParams.get('sort') || DEFAULT_SORT,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
};

/**
 * Returns new search params with `key` set (or removed when empty). Any filter change
 * goes back to page 1, because the old page may not exist in the new result set.
 */
export const withParam = (searchParams, key, value) => {
  const next = new URLSearchParams(searchParams);
  if (value === undefined || value === null || value === '') next.delete(key);
  else next.set(key, String(value));
  if (key !== 'page') next.delete('page');
  if (key === 'sort' && value === DEFAULT_SORT) next.delete('sort');
  return next;
};

export const activeFilterCount = (searchParams) =>
  ['size', 'price', 'search', 'brand'].filter((key) => searchParams.get(key)).length;
