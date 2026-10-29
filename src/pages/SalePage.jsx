import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFacets, listBrands, listProducts, SORT_OPTIONS } from '../api/catalog';
import { useResource } from '../hooks/useResource';
import { PRICE_BANDS, withParam, activeFilterCount } from '../lib/catalogQuery';
import { FilterPanel } from '../components/catalog/FilterPanel';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { Pagination } from '../components/catalog/Pagination';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/States';

/**
 * Sale page (Sprint 13, #194): the home page "Browse sale" button lands here. Shows only
 * products with an active discount - same filtering UI as the shop, minus the category tree
 * (a sale spans every category), with `section: 'sale'` always applied regardless of the URL.
 */
export default function SalePage() {
  const [params, setParams] = useSearchParams();
  const band = PRICE_BANDS.find((b) => b.value === params.get('price'));
  const page = Number.parseInt(params.get('page'), 10);
  const filters = {
    section: 'sale',
    search: params.get('search') || undefined,
    size: params.get('size') || undefined,
    color: params.get('color') || undefined,
    brand: params.get('brand') || undefined,
    minPrice: band?.min,
    maxPrice: band?.max,
    sort: params.get('sort') || 'newest',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
  const key = params.toString();
  const activeCount = activeFilterCount(params);

  const products = useResource(() => listProducts(filters), [key]);
  const { data: brands } = useResource(() => listBrands().catch(() => []), []);
  const { data: facets } = useResource(() => getFacets().catch(() => null), []);

  useEffect(() => {
    document.title = 'Sale | Dickwella Fashion Corner';
  }, []);

  const setFilter = (name, value) => setParams(withParam(params, name, value));
  const clearFilters = () => setParams(new URLSearchParams());
  const total = products.data?.pagination?.total ?? 0;

  return (
    <div className="container page catalog">
      <header className="catalog__header">
        <div>
          <h1>Sale</h1>
          <p className="catalog__tagline">Discounted pieces while they last.</p>
          {!products.loading && !products.error && (
            <p className="catalog__count" role="status">
              {total} {total === 1 ? 'product' : 'products'} on sale
            </p>
          )}
        </div>
        <label className="sort">
          <span>Sort by</span>
          <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="catalog__body">
        <FilterPanel
          id="sale-filters"
          isOpen
          categories={[]}
          params={params}
          onChange={setFilter}
          onClear={clearFilters}
          colours={facets?.colors}
          brands={brands || []}
        />
        <section aria-labelledby="sale-results-heading" className="catalog__results">
          <h2 id="sale-results-heading" className="visually-hidden">
            Sale products
          </h2>
          {products.loading && <LoadingState label="Loading sale products" />}
          {products.error && <ErrorState error={products.error} onRetry={products.reload} />}
          {products.data && products.data.products.length === 0 && (
            <EmptyState
              title="Nothing on sale right now"
              action={
                activeCount > 0 ? (
                  <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : (
                  <Link to="/shop" className="btn btn--secondary">
                    Browse the shop instead
                  </Link>
                )
              }
            >
              Check back soon, or browse everything we have.
            </EmptyState>
          )}
          {products.data && products.data.products.length > 0 && (
            <>
              <ProductGrid products={products.data.products} />
              <Pagination
                page={filters.page}
                totalPages={products.data.pagination?.totalPages}
                onChange={(p) => setFilter('page', p)}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
