import React, { useState } from 'react';
import { PackageSearch, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { FilterSidebar } from './FilterSidebar';
import { Modal } from '../common/Modal';
import { formatLKR } from '../../utils/formatters';
import './ProductGrid.css';

export const ProductGrid = ({
  products = [],
  isLoading = false,
  filters = {},
  onFilterChange,
  onClearFilters,
  onAddToCart,
  onToggleWishlist,
  onViewDetails,
  wishlistIds = [],
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const {
    category = 'all',
    max_price = 20000,
    size = '',
    color = '',
    sort = 'featured',
  } = filters;

  const handleSortChange = (e) => {
    if (onFilterChange) {
      onFilterChange('sort', e.target.value);
    }
  };

  const activePills = [];
  if (category && category !== 'all') {
    activePills.push({ key: 'category', label: `Category: ${category}`, resetVal: 'all' });
  }
  if (max_price && max_price < 20000) {
    activePills.push({ key: 'max_price', label: `Max: ${formatLKR(max_price)}`, resetVal: 20000 });
  }
  if (size) {
    activePills.push({ key: 'size', label: `Size: ${size}`, resetVal: '' });
  }
  if (color) {
    activePills.push({ key: 'color', label: `Color: ${color}`, resetVal: '' });
  }

  return (
    <div className="dk-catalog-layout" data-testid="catalog-layout">
      {/* Desktop Filter Sidebar */}
      <div className="dk-filter-sidebar-desktop">
        <FilterSidebar
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />
      </div>

      {/* Main Catalog View */}
      <div className="dk-catalog-content" data-testid="catalog-main-content">
        {/* Toolbar: Count + Mobile Filter Trigger + Sort Dropdown */}
        <div className="dk-catalog-toolbar">
          <div className="dk-catalog-count" data-testid="products-count">
            Showing <strong>{products.length}</strong> apparel items
          </div>

          <div className="dk-catalog-controls">
            <button
              type="button"
              className="dk-mobile-filter-btn"
              onClick={() => setIsMobileFilterOpen(true)}
              data-testid="mobile-filter-toggle"
            >
              <SlidersHorizontal size={14} />
              <span>Filters {activePills.length > 0 && `(${activePills.length})`}</span>
            </button>

            <div className="dk-sort-group">
              <label htmlFor="catalog-sort-select" className="dk-sort-label">
                Sort by:
              </label>
              <select
                id="catalog-sort-select"
                className="dk-sort-select"
                value={sort}
                onChange={handleSortChange}
                data-testid="catalog-sort-select"
              >
                <option value="featured">Featured Collections</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Tags Bar */}
        {activePills.length > 0 && (
          <div className="dk-active-filters-bar" data-testid="active-filters-bar">
            {activePills.map((pill) => (
              <span key={pill.key} className="dk-active-filter-pill">
                <span>{pill.label}</span>
                <button
                  type="button"
                  className="dk-active-filter-remove"
                  onClick={() => onFilterChange(pill.key, pill.resetVal)}
                  aria-label={`Remove filter ${pill.label}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              className="dk-clear-filters-btn"
              onClick={onClearFilters}
              style={{ marginLeft: 'var(--space-2)' }}
            >
              Reset All
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="dk-products-grid" data-testid="products-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="dk-skeleton-card" data-testid="skeleton-card">
                <div className="dk-skeleton-media" />
                <div className="dk-skeleton-body">
                  <div className="dk-skeleton-line" style={{ width: '40%' }} />
                  <div className="dk-skeleton-line" style={{ width: '85%' }} />
                  <div className="dk-skeleton-line" style={{ width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          /* Products Grid */
          <div className="dk-products-grid" data-testid="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id || product.slug}
                product={product}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                onViewDetails={onViewDetails}
                isWishlisted={wishlistIds.some((id) => String(id) === String(product.id))}
              />
            ))}
          </div>
        ) : (
          /* Branded Empty State (AC4) */
          <div className="dk-catalog-empty-state" data-testid="catalog-empty-state">
            <div className="dk-empty-icon-wrap">
              <PackageSearch size={32} />
            </div>
            <h3 className="dk-empty-title">No apparel matches your filter criteria</h3>
            <p className="dk-empty-desc">
              We couldn't find any Sri Lankan handloom or batik items matching your chosen filters. Try expanding your price budget, selecting different sizes, or resetting all filters.
            </p>
            <button
              type="button"
              className="dk-modal-btn dk-modal-btn--primary"
              onClick={onClearFilters}
              data-testid="empty-clear-filters-btn"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filters Modal */}
      <Modal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter Apparel Catalog"
        size="md"
        footer={
          <button
            type="button"
            className="dk-modal-btn dk-modal-btn--primary"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            Apply Filters ({products.length} Items)
          </button>
        }
      >
        <FilterSidebar
          filters={filters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />
      </Modal>
    </div>
  );
};

export default ProductGrid;
