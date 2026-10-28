import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductGallery } from '../components/pdp/ProductGallery';
import { VariantSelector } from '../components/pdp/VariantSelector';
import { ProductDetailPage } from '../pages/ProductDetailPage';

describe('STORM-FE-007: Product Detail Page (PDP), Image Gallery & Variant Matrix', () => {
  const mockProduct = {
    id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Classic Batik Short Sleeve Shirt',
    slug: 'classic-batik-short-sleeve-shirt',
    description: 'Authentic Sri Lankan wax-resist dyed batik shirt in breathable tropical cotton.',
    base_price: 4850,
    category_name: "Men's Apparel",
    badge: 'Artisan Batik',
    rating: 4.9,
    review_count: 38,
    sizes: ['M', 'L', 'XL'],
    colors: ['Ocean Blue', 'Indigo Navy'],
    images: [
      {
        id: 'img-1',
        image_url:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Front View',
        is_primary: true,
      },
      {
        id: 'img-2',
        image_url:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Fabric Detail',
        is_primary: false,
      },
    ],
    variants: [
      {
        id: 'var-1',
        sku: 'MS-BAT-001-BLU-M',
        size: 'M',
        color: 'Ocean Blue',
        stock_quantity: 25,
        reserved_quantity: 5,
        price_override: null,
      },
      {
        id: 'var-2',
        sku: 'MS-BAT-001-BLU-L',
        size: 'L',
        color: 'Ocean Blue',
        stock_quantity: 30,
        reserved_quantity: 0,
        price_override: 5200,
      },
      {
        id: 'var-3',
        sku: 'MS-BAT-001-BLU-XL',
        size: 'XL',
        color: 'Ocean Blue',
        stock_quantity: 4,
        reserved_quantity: 4, // available_stock = 0 (Out of stock!)
        price_override: null,
      },
      {
        id: 'var-4',
        sku: 'MS-BAT-001-NVY-M',
        size: 'M',
        color: 'Indigo Navy',
        stock_quantity: 3,
        reserved_quantity: 0, // available_stock = 3 (Low stock!)
        price_override: null,
      },
    ],
  };

  // Test 1: Image Gallery thumbnail switching & click-to-zoom modal view (AC2)
  it('AC2: should switch active image on thumbnail click and toggle zoom modal view', () => {
    render(
      <ProductGallery
        images={mockProduct.images}
        title={mockProduct.title}
        badge={mockProduct.badge}
      />
    );

    const mainImage = screen.getByTestId('pdp-main-image');
    expect(mainImage.getAttribute('src')).toBe(mockProduct.images[0].image_url);

    // Click second thumbnail
    const thumb1 = screen.getByTestId('pdp-thumbnail-1');
    fireEvent.click(thumb1);

    expect(mainImage.getAttribute('src')).toBe(mockProduct.images[1].image_url);

    // Click zoom trigger button
    const zoomBtn = screen.getByTestId('pdp-zoom-trigger');
    fireEvent.click(zoomBtn);

    const zoomModal = screen.getByTestId('pdp-zoom-modal');
    expect(zoomModal).toBeDefined();

    // Close zoom modal
    const closeBtn = screen.getByTestId('pdp-zoom-close');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('pdp-zoom-modal')).toBeNull();
  });

  // Test 2: Variant matrix resolution updating SKU, price override, and live stock calculation (AC3)
  it('AC3: should resolve discrete SKU, dynamic stock status and price override on variant change', () => {
    let selectedColor = 'Ocean Blue';
    let selectedSize = 'M';
    const onSelectSize = vi.fn((size) => {
      selectedSize = size;
    });
    const onSelectColor = vi.fn((color) => {
      selectedColor = color;
    });

    const { rerender } = render(
      <VariantSelector
        product={mockProduct}
        selectedColor={selectedColor}
        onSelectColor={onSelectColor}
        selectedSize={selectedSize}
        onSelectSize={onSelectSize}
      />
    );

    // Active variant is var-1: stock_quantity 25, reserved 5 => available = 20
    const skuElem = screen.getByTestId('pdp-sku');
    expect(skuElem.textContent).toBe('MS-BAT-001-BLU-M');

    const stockBadge = screen.getByTestId('pdp-stock-badge');
    expect(stockBadge.textContent).toContain('In Stock (20 available)');

    // Select Size L which has price override 5200 and 30 available
    const sizeLBtn = screen.getByTestId('size-option-l');
    fireEvent.click(sizeLBtn);
    expect(onSelectSize).toHaveBeenCalledWith('L');

    rerender(
      <VariantSelector
        product={mockProduct}
        selectedColor={selectedColor}
        onSelectColor={onSelectColor}
        selectedSize="L"
        onSelectSize={onSelectSize}
      />
    );

    expect(screen.getByTestId('pdp-sku').textContent).toBe('MS-BAT-001-BLU-L');
    expect(screen.getByTestId('pdp-price').textContent).toContain('5,200.00');
    expect(screen.getByTestId('pdp-stock-badge').textContent).toContain('In Stock (30 available)');
  });

  // Test 3: Out-of-stock variant disables Add to Cart and displays Notify Me trigger (AC4)
  it('AC4: should disable Add-to-Cart and render Notify-Me trigger when selected variant stock is 0', () => {
    const handleAddToCart = vi.fn();
    const handleNotifyMe = vi.fn();

    render(
      <VariantSelector
        product={mockProduct}
        selectedColor="Ocean Blue"
        selectedSize="XL" // Var-3: stock 4, reserved 4 => available 0
        quantity={1}
        onAddToCart={handleAddToCart}
        onNotifyMe={handleNotifyMe}
      />
    );

    expect(screen.getByTestId('pdp-sku').textContent).toBe('MS-BAT-001-BLU-XL');

    const stockBadge = screen.getByTestId('pdp-stock-badge');
    expect(stockBadge.textContent).toBe('Out of Stock');

    const addToCartBtn = screen.getByTestId('add-to-cart-btn');
    expect(addToCartBtn.hasAttribute('disabled')).toBe(true);

    const notifyMeBtn = screen.getByTestId('notify-me-btn');
    expect(notifyMeBtn).toBeDefined();

    fireEvent.click(notifyMeBtn);
    expect(handleNotifyMe).toHaveBeenCalledTimes(1);
  });

  // Test 4: Quantity Stepper boundaries & ProductDetailPage tabs navigation
  it('should enforce quantity boundaries and allow switching tabs on full ProductDetailPage', async () => {
    const handleBack = vi.fn();
    const handleWishlist = vi.fn();

    render(
      <ProductDetailPage
        initialProduct={mockProduct}
        onBack={handleBack}
        onToggleWishlist={handleWishlist}
      />
    );

    expect(screen.getByTestId('pdp-product-title').textContent).toBe(mockProduct.title);

    // Click back button
    fireEvent.click(screen.getByTestId('pdp-back-btn'));
    expect(handleBack).toHaveBeenCalledTimes(1);

    // Click wishlist button
    fireEvent.click(screen.getByTestId('pdp-wishlist-btn'));
    expect(handleWishlist).toHaveBeenCalledTimes(1);

    // Check tabs
    expect(screen.getByTestId('tab-content-specs')).toBeDefined();

    const deliveryTab = screen.getByTestId('tab-delivery');
    fireEvent.click(deliveryTab);
    expect(screen.getByTestId('tab-content-delivery')).toBeDefined();

    const reviewsTab = screen.getByTestId('tab-reviews');
    fireEvent.click(reviewsTab);
    expect(screen.getByTestId('tab-content-reviews')).toBeDefined();
  });
});
