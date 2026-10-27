import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Header } from '../components/navigation/Header';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';
import { DEFAULT_FALLBACK_CATEGORIES } from '../api/category.api';

describe('STORM-FE-005: Responsive Storefront Header, Category Mega-Menu & Dynamic Breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header Component', () => {
    it('AC1 & AC3: renders brand identity, navigation items, and action badges', () => {
      render(<Header wishlistCount={3} cartCount={2} categories={DEFAULT_FALLBACK_CATEGORIES} />);

      // Verify Brand Logo
      expect(screen.getByTestId('header-brand-logo')).toHaveTextContent(
        /Dickwella Fashion Corner/i
      );

      // Verify Badges
      expect(screen.getByTestId('wishlist-badge')).toHaveTextContent('3');
      expect(screen.getByTestId('cart-badge')).toHaveTextContent('2');

      // Verify Desktop Category Links
      expect(screen.getByTestId('nav-item-men')).toHaveTextContent('Men');
      expect(screen.getByTestId('nav-item-women')).toHaveTextContent('Women');
      expect(screen.getByTestId('nav-item-kids')).toHaveTextContent('Kids');
      expect(screen.getByTestId('nav-item-accessories')).toHaveTextContent('Accessories');
    });

    it('AC2: reveals glassmorphic MegaMenu with subcategories when hovering over top-level category', () => {
      render(<Header categories={DEFAULT_FALLBACK_CATEGORIES} />);

      // Initially MegaMenu is not mounted
      expect(screen.queryByTestId('mega-menu')).not.toBeInTheDocument();

      // Hover over "Men"
      const menNavItem = screen.getByTestId('nav-item-men').parentElement;
      fireEvent.mouseEnter(menNavItem);

      // MegaMenu should now be visible
      const megaMenu = screen.getByTestId('mega-menu');
      expect(megaMenu).toBeInTheDocument();
      expect(screen.getByText(/Men Collection/i)).toBeInTheDocument();
      expect(screen.getByTestId('submenu-item-men-batik-shirts')).toBeInTheDocument();
      expect(screen.getByText('Batik Shirts')).toBeInTheDocument();
      expect(screen.getByText('Linen Casual Shirts')).toBeInTheDocument();
    });

    it('AC3: handles live search query input and form submission', () => {
      const handleSearch = vi.fn();
      render(<Header categories={DEFAULT_FALLBACK_CATEGORIES} onSearch={handleSearch} />);

      const searchInput = screen.getByTestId('header-search-input');
      fireEvent.change(searchInput, { target: { value: 'Batik Saree' } });
      expect(searchInput.value).toBe('Batik Saree');

      // Submit form
      fireEvent.submit(searchInput.closest('form'));
      expect(handleSearch).toHaveBeenCalledWith('Batik Saree');
    });

    it('AC1 & Responsive: opens mobile drawer and toggles subcategory accordion', () => {
      render(<Header categories={DEFAULT_FALLBACK_CATEGORIES} />);

      // Open drawer
      const toggleBtn = screen.getByTestId('mobile-menu-toggle');
      fireEvent.click(toggleBtn);

      const drawer = screen.getByTestId('mobile-drawer');
      expect(drawer).toBeInTheDocument();

      // Click Women category accordion
      const womenBtn = screen.getByTestId('mobile-cat-btn-women');
      fireEvent.click(womenBtn);

      // Sublist should appear
      expect(screen.getByTestId('mobile-sublist-women')).toBeInTheDocument();
      expect(screen.getByText('Silk Saris')).toBeInTheDocument();

      // Close drawer
      const closeBtn = screen.getByTestId('mobile-drawer-close');
      fireEvent.click(closeBtn);
      expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument();
    });
  });

  describe('Breadcrumbs Component', () => {
    it('AC4: renders semantic breadcrumb trail with correct aria-current on active leaf', () => {
      const trail = [
        { label: 'Home', href: '/' },
        { label: 'Women', href: '/catalog/women' },
        { label: 'Silk Saris', href: '/catalog/women/silk-saris', active: true },
      ];

      render(<Breadcrumbs items={trail} />);

      expect(screen.getByTestId('breadcrumbs-nav')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-link-0')).toHaveTextContent('Home');
      expect(screen.getByTestId('breadcrumb-link-1')).toHaveTextContent('Women');

      const current = screen.getByTestId('breadcrumb-current');
      expect(current).toHaveTextContent('Silk Saris');
      expect(current).toHaveAttribute('aria-current', 'page');
    });

    it('AC4: injects valid Schema.org BreadcrumbList JSON-LD microdata for SEO', () => {
      const trail = [
        { label: 'Home', href: '/' },
        { label: 'Men', href: '/catalog/men' },
        { label: 'Batik Shirts', href: '/catalog/men/batik-shirts' },
      ];

      render(<Breadcrumbs items={trail} />);

      const jsonLdScript = screen.getByTestId('breadcrumb-jsonld');
      expect(jsonLdScript).toBeInTheDocument();

      const parsed = JSON.parse(jsonLdScript.innerHTML);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('BreadcrumbList');
      expect(parsed.itemListElement).toHaveLength(3);
      expect(parsed.itemListElement[0].name).toBe('Home');
      expect(parsed.itemListElement[1].name).toBe('Men');
      expect(parsed.itemListElement[2].name).toBe('Batik Shirts');
      expect(parsed.itemListElement[2].position).toBe(3);
    });
  });
});
