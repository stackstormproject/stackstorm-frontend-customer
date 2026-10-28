import React from 'react';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { formatLKR } from '../../utils/formatters';
import './FilterSidebar.css';

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Collections', slug: 'all' },
  { id: 'men', name: "Men's Apparel", slug: 'men' },
  { id: 'women', name: "Women's Sarees & Kurtis", slug: 'women' },
  { id: 'kids', name: 'Kids Traditional', slug: 'kids' },
  { id: 'accessories', name: 'Accessories & Shawls', slug: 'accessories' },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const COLORS = [
  { name: 'Ocean Blue', hex: '#0284C7' },
  { name: 'Indigo Navy', hex: '#1E3A8A' },
  { name: 'Earthy Ochre', hex: '#D97706' },
  { name: 'Kandyan Red', hex: '#DC2626' },
  { name: 'Pure White', hex: '#F8FAFC' },
  { name: 'Ceylon Emerald', hex: '#059669' },
];

export const FilterSidebar = ({
  filters = {},
  onFilterChange,
  onClearFilters,
  categories = DEFAULT_CATEGORIES,
}) => {
  const { category = 'all', max_price = 20000, size = '', color = '' } = filters;

  const handleCategorySelect = (catSlug) => {
    if (onFilterChange) {
      onFilterChange('category', catSlug);
    }
  };

  const handlePriceChange = (e) => {
    const val = Number(e.target.value);
    if (onFilterChange) {
      onFilterChange('max_price', val);
    }
  };

  const handleSizeSelect = (sz) => {
    const newSize = size === sz ? '' : sz;
    if (onFilterChange) {
      onFilterChange('size', newSize);
    }
  };

  const handleColorSelect = (clr) => {
    const newColor = color === clr ? '' : clr;
    if (onFilterChange) {
      onFilterChange('color', newColor);
    }
  };

  const hasActiveFilters = category !== 'all' || max_price < 20000 || size || color;

  return (
    <aside
      className="dk-filter-sidebar"
      data-testid="filter-sidebar"
      aria-label="Product Catalog Filters"
    >
      <div className="dk-filter-header">
        <h3 className="dk-filter-title">
          <SlidersHorizontal size={18} color="#D4AF37" />
          <span>Faceted Filters</span>
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            className="dk-clear-filters-btn"
            onClick={onClearFilters}
            data-testid="clear-filters-btn"
          >
            Clear All
          </button>
        )}
      </div>

      {/* 1. Category Hierarchy Filter */}
      <div className="dk-filter-section">
        <h4 className="dk-filter-section-title">Apparel Categories</h4>
        <ul className="dk-filter-category-list">
          {categories.map((cat) => {
            const isCatActive = category === cat.slug;
            return (
              <li key={cat.slug || cat.id}>
                <button
                  type="button"
                  className={`dk-category-btn ${isCatActive ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.slug)}
                  data-testid={`filter-cat-${cat.slug}`}
                >
                  <span>{cat.name}</span>
                  {isCatActive && <Check size={14} color="#D4AF37" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 2. Price Range Slider */}
      <div className="dk-filter-section">
        <h4 className="dk-filter-section-title">Price Budget (LKR)</h4>
        <div className="dk-price-slider-group">
          <input
            type="range"
            min="2000"
            max="20000"
            step="500"
            value={max_price}
            onChange={handlePriceChange}
            className="dk-price-range-input"
            aria-label="Filter by maximum price"
            data-testid="price-slider-input"
          />
          <div className="dk-price-values">
            <span>Min: LKR 2,000</span>
            <span
              style={{ color: 'var(--color-primary)', fontWeight: 600 }}
              data-testid="max-price-display"
            >
              Up to {formatLKR(max_price)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Size Pills */}
      <div className="dk-filter-section">
        <h4 className="dk-filter-section-title">Size Selection</h4>
        <div className="dk-size-pills-grid">
          {SIZES.map((sz) => {
            const isSizeActive = size === sz;
            return (
              <button
                key={sz}
                type="button"
                className={`dk-size-pill ${isSizeActive ? 'active' : ''}`}
                onClick={() => handleSizeSelect(sz)}
                data-testid={`filter-size-${sz}`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Color Swatches */}
      <div className="dk-filter-section">
        <h4 className="dk-filter-section-title">Color Palette</h4>
        <div className="dk-color-swatches-grid">
          {COLORS.map((clr) => {
            const isColorActive = color === clr.name;
            return (
              <button
                key={clr.name}
                type="button"
                className={`dk-color-swatch-btn ${isColorActive ? 'active' : ''}`}
                onClick={() => handleColorSelect(clr.name)}
                data-testid={`filter-color-${clr.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span
                  className="dk-color-dot"
                  style={{ backgroundColor: clr.hex }}
                  aria-hidden="true"
                />
                <span>{clr.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
