import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { formatLKR, formatRating } from '../utils/formatters';
import { ProductCard } from '../components/catalog/ProductCard';
import { FilterSidebar } from '../components/catalog/FilterSidebar';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { FALLBACK_PRODUCTS } from '../api/product.api';

describe('STORM-FE-006: Product Catalog Grid, Multi-Faceted Filters & Dynamic Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Currency & Rating Formatters', () => {
    it('formats numeric amounts to Sri Lankan Rupee currency standard', () => {
      expect(formatLKR(4850)).toBe('LKR 4,850.00');
      expect(formatLKR(12500)).toBe('LKR 12,500.00');
      expect(formatLKR(0)).toBe('LKR 0.00');
      expect(formatLKR('invalid')).toBe('LKR 0.00');
    });

    it('formats ratings to single decimal precision', () => {
      expect(formatRating(4.85)).toBe('4.9');
      expect(formatRating(5)).toBe('5.0');
    });
  });

  describe('ProductCard Component', () => {
    const mockProduct = FALLBACK_PRODUCTS[0];

    it('AC2: renders primary image, category, title, formatted LKR price, and rating', () => {
      render(<ProductCard product={mockProduct} />);

      expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.category_name)).toBeInTheDocument();
      expect(screen.getByTestId('card-formatted-price')).toHaveTextContent(
        formatLKR(mockProduct.base_price)
      );
      expect(screen.getByText(/4\.9/)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: mockProduct.title })).toHaveAttribute(
        'src',
        mockProduct.primary_image
      );
    });

    it('triggers onAddToCart and onToggleWishlist actions with event propagation stopped', () => {
      const handleAddToCart = vi.fn();
      const handleToggleWishlist = vi.fn();
      const handleViewDetails = vi.fn();

      render(
        <ProductCard
          product={mockProduct}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          onViewDetails={handleViewDetails}
        />
      );

      // Click Quick Add
      const addBtn = screen.getByTestId('card-quick-add-btn');
      fireEvent.click(addBtn);
      expect(handleAddToCart).toHaveBeenCalledWith(mockProduct);
      expect(handleViewDetails).not.toHaveBeenCalled();

      // Click Wishlist
      const wishlistBtn = screen.getByTestId('card-wishlist-btn');
      fireEvent.click(wishlistBtn);
      expect(handleToggleWishlist).toHaveBeenCalledWith(mockProduct);
      expect(handleViewDetails).not.toHaveBeenCalled();
    });
  });

  describe('FilterSidebar Component', () => {
    it('AC3: handles category, price slider, size, and color swatch mutations', () => {
      const handleFilterChange = vi.fn();
      const handleClearFilters = vi.fn();

      render(
        <FilterSidebar
          filters={{ category: 'all', max_price: 15000, size: '', color: '' }}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      );

      // Select Category
      fireEvent.click(screen.getByTestId('filter-cat-men'));
      expect(handleFilterChange).toHaveBeenCalledWith('category', 'men');

      // Adjust Price Slider
      const slider = screen.getByTestId('price-slider-input');
      fireEvent.change(slider, { target: { value: '8000' } });
      expect(handleFilterChange).toHaveBeenCalledWith('max_price', 8000);

      // Select Size Pill
      fireEvent.click(screen.getByTestId('filter-size-L'));
      expect(handleFilterChange).toHaveBeenCalledWith('size', 'L');

      // Select Color Swatch
      fireEvent.click(screen.getByTestId('filter-color-ocean-blue'));
      expect(handleFilterChange).toHaveBeenCalledWith('color', 'Ocean Blue');

      // Clear Filters button
      fireEvent.click(screen.getByTestId('clear-filters-btn'));
      expect(handleClearFilters).toHaveBeenCalled();
    });
  });

  describe('ProductGrid Component', () => {
    it('AC1: renders products grid and displays product count in toolbar', () => {
      render(
        <ProductGrid
          products={FALLBACK_PRODUCTS.slice(0, 3)}
          filters={{ category: 'all', sort: 'featured' }}
        />
      );

      expect(screen.getByTestId('products-count')).toHaveTextContent('Showing 3 apparel items');
      expect(screen.getByTestId('products-grid')).toBeInTheDocument();
      expect(screen.getByText('Signature Linen Batik Shirt')).toBeInTheDocument();
      expect(screen.getByText('Heritage Indigo Handloom Batik Shirt')).toBeInTheDocument();
    });

    it('renders skeleton cards when isLoading is true', () => {
      render(<ProductGrid products={[]} isLoading={true} />);

      expect(screen.getByTestId('products-skeleton-grid')).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton-card').length).toBeGreaterThan(0);
    });

    it('AC4: renders branded empty state when no products match criteria with clear button', () => {
      const handleClear = vi.fn();
      render(
        <ProductGrid
          products={[]}
          isLoading={false}
          onClearFilters={handleClear}
          filters={{ category: 'accessories', max_price: 2500 }}
        />
      );

      expect(screen.getByTestId('catalog-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No apparel matches your filter criteria')).toBeInTheDocument();

      const clearBtn = screen.getByTestId('empty-clear-filters-btn');
      fireEvent.click(clearBtn);
      expect(handleClear).toHaveBeenCalled();
    });

    it('displays active filter badges bar and handles sorting change', () => {
      const handleFilterChange = vi.fn();
      render(
        <ProductGrid
          products={FALLBACK_PRODUCTS}
          filters={{ category: 'men', size: 'M', sort: 'price_asc' }}
          onFilterChange={handleFilterChange}
        />
      );

      expect(screen.getByTestId('active-filters-bar')).toBeInTheDocument();
      expect(screen.getByText('Category: men')).toBeInTheDocument();
      expect(screen.getByText('Size: M')).toBeInTheDocument();

      // Change sorting
      const sortSelect = screen.getByTestId('catalog-sort-select');
      fireEvent.change(sortSelect, { target: { value: 'price_desc' } });
      expect(handleFilterChange).toHaveBeenCalledWith('sort', 'price_desc');
    });
  });
});
