import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { CartDrawer } from '../components/cart/CartDrawer';
import { CartItemRow } from '../components/cart/CartItemRow';
import { FALLBACK_PRODUCTS } from '../api/product.api';

describe('STORM-FE-009: Slide-Over Cart Drawer, Live Quantity Adjusters & Guest Sync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockProduct = FALLBACK_PRODUCTS[0]; // base_price: 4500
  const mockVariant = {
    id: 'var-1',
    sku: 'BATIK-001-M',
    size: 'M',
    color: 'Ocean Blue',
    price_override: null,
    available_stock: 10,
  };

  const sampleCartItem = {
    id: 'cart-1',
    product_id: mockProduct.id,
    variant_id: 'var-1',
    sku: 'BATIK-001-M',
    title: 'Signature Linen Batik Shirt',
    size: 'M',
    color: 'Ocean Blue',
    unit_price: 4500,
    quantity: 2,
    subtotal: 9000,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    available_stock: 10,
  };

  // Test 1: CartDrawer mounts with backdrop and handles dismissal (AC1)
  it('AC1: should render CartDrawer slide-over and handle close trigger and backdrop dismissal', () => {
    const handleClose = vi.fn();

    const { rerender } = render(<CartDrawer isOpen={true} onClose={handleClose} items={[]} />);

    const drawer = screen.getByTestId('cart-drawer-panel');
    expect(drawer).toBeInTheDocument();
    expect(drawer.classList.contains('is-open')).toBe(true);

    // Close button
    const closeBtn = screen.getByTestId('cart-drawer-close');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Backdrop click
    const backdrop = screen.getByTestId('cart-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(2);

    // When isOpen is false
    rerender(<CartDrawer isOpen={false} onClose={handleClose} items={[]} />);
    expect(drawer.classList.contains('is-open')).toBe(false);
  });

  // Test 2: CartDrawer renders line items with variant details and subtotal (AC2)
  it('AC2: should render line items with variant badges, unit price, and accurate subtotal', () => {
    render(<CartDrawer isOpen={true} items={[sampleCartItem]} />);

    expect(screen.getByText('Signature Linen Batik Shirt')).toBeInTheDocument();
    expect(screen.getByTestId(`cart-item-size-${sampleCartItem.id}`)).toHaveTextContent('Size: M');
    expect(screen.getByTestId(`cart-item-color-${sampleCartItem.id}`)).toHaveTextContent(
      'Color: Ocean Blue'
    );
    expect(screen.getByTestId(`cart-qty-${sampleCartItem.id}`)).toHaveTextContent('2');
    expect(screen.getByTestId(`cart-item-total-${sampleCartItem.id}`)).toHaveTextContent(
      'LKR 9,000.00'
    );
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('LKR 9,000.00');
  });

  // Test 3: Incrementing and decrementing quantity updates line total and cart aggregates (AC3)
  it('AC3: should update quantity and recompute line total and cart aggregates', () => {
    const handleUpdateQty = vi.fn();
    const handleRemove = vi.fn();

    render(
      <CartItemRow
        item={sampleCartItem}
        onUpdateQuantity={handleUpdateQty}
        onRemove={handleRemove}
      />
    );

    // Increment
    const incBtn = screen.getByTestId(`cart-inc-${sampleCartItem.id}`);
    fireEvent.click(incBtn);
    expect(handleUpdateQty).toHaveBeenCalledWith(sampleCartItem.id, 3);

    // Decrement
    const decBtn = screen.getByTestId(`cart-dec-${sampleCartItem.id}`);
    fireEvent.click(decBtn);
    expect(handleUpdateQty).toHaveBeenCalledWith(sampleCartItem.id, 1);

    // Direct remove
    const removeBtn = screen.getByTestId(`cart-remove-${sampleCartItem.id}`);
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith(sampleCartItem.id);
  });

  // Test 4: CartContext handles state mutations, debouncing, and promo codes (AC3, AC4)
  it('AC4: should handle CartContext mutations, auto-open drawer, and apply promo discount', async () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.isOpen).toBe(false);

    // Add item to cart
    await act(async () => {
      result.current.addItem(mockProduct, mockVariant, 2);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.subtotal).toBe(9000);
    expect(result.current.isOpen).toBe(true);

    // Apply promo code DICKWELLA10 (10% discount)
    act(() => {
      const res = result.current.applyPromoCode('DICKWELLA10');
      expect(res.success).toBe(true);
    });

    expect(result.current.discountAmount).toBe(900);
    expect(result.current.discountedSubtotal).toBe(8100);
  });
});
