import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { listProducts, listCategories, SORT_OPTIONS } from '../api/catalog';
import { useResource } from '../hooks/useResource';
import {
  filtersFromUrl,
  withParam,
  activeFilterCount,
  flattenCategories,
} from '../lib/catalogQuery';
import { FilterPanel } from '../components/catalog/FilterPanel';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { Pagination } from '../components/catalog/Pagination';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/States';

export default function CatalogPage() {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const filters = filtersFromUrl(category, params);
  const key = `${category || ''}?${params.toString()}`;

  const [showFilters, setShowFilters] = useState(false);
  const activeCount = activeFilterCount(params);
  const products = useResource(() => listProducts(filters), [key]);
  const { data: tree } = useResource(listCategories, []);
  const categories = flattenCategories(tree || []);

  const current = categories.find((c) => c.slug === category);
  const title =
    (filters.search && `Results for "${filters.search}"`) || current?.name || 'All products';

  useEffect(() => {
    document.title = `${title} | Dickwella Fashion Corner`;
  }, [title]);

  const setFilter = (name, value) => setParams(withParam(params, name, value));
  const clearFilters = () => setParams(new URLSearchParams());

  const total = products.data?.pagination?.total ?? 0;

  return (
    <div className="container page catalog">
      <header className="catalog__header">
        <div>
          <h1>{title}</h1>
          {!products.loading && !products.error && (
            <p className="catalog__count" role="status">
              {total} {total === 1 ? 'product' : 'products'}
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

      <button
        type="button"
        className="btn btn--ghost filters-toggle"
        aria-expanded={showFilters}
        aria-controls="catalog-filters"
        onClick={() => setShowFilters((v) => !v)}
      >
        {showFilters ? 'Hide filters' : 'Filters'}
        {activeCount > 0 && ` (${activeCount})`}
      </button>

      <div className="catalog__body">
        <FilterPanel
          id="catalog-filters"
          isOpen={showFilters}
          category={category}
          categories={categories}
          params={params}
          onChange={setFilter}
          onClear={clearFilters}
        />
        <section aria-labelledby="results-heading" className="catalog__results">
          <h2 id="results-heading" className="visually-hidden">
            Products
          </h2>
          {products.loading && <LoadingState label="Loading products" />}
          {products.error && <ErrorState error={products.error} onRetry={products.reload} />}
          {products.data && products.data.products.length === 0 && (
            <EmptyState
              title="No products match"
              action={
                activeCount > 0 ? (
                  <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : (
                  <Link to="/shop" className="btn btn--secondary">
                    See all products
                  </Link>
                )
              }
            >
              Try another size or price, or search for something else.
            </EmptyState>
          )}
          {products.data && products.data.products.length > 0 && (
            <>
              <ProductGrid products={products.data.products} />
              <Pagination
                page={filters.page}
                totalPages={products.data.pagination?.totalPages}
                onChange={(page) => setFilter('page', page)}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
