import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { CheckoutPage } from '../pages/CheckoutPage';

describe('STORM-FE-011: CheckoutPage Financial Calculations & Bill Value Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  const sampleCartItems = [
    {
      id: 'item-1',
      product_id: 'p-1',
      variant_id: 'var-1',
      title: 'Signature Linen Batik Shirt',
      size: 'L',
      color: 'Ocean Blue',
      unit_price: 4500,
      quantity: 2,
      subtotal: 9000,
    },
    {
      id: 'item-2',
      product_id: 'p-2',
      variant_id: 'var-2',
      title: 'Tailored Linen Trousers',
      size: 'M',
      color: 'Natural Sand',
      unit_price: 5200,
      quantity: 1,
      subtotal: 5200,
    },
  ];

  it('renders accurate financial breakdown with real line item prices and non-zero subtotal and total', () => {
    render(
      <ToastProvider>
        <CartProvider initialItems={sampleCartItems}>
          <CheckoutPage />
        </CartProvider>
      </ToastProvider>
    );

    // 1. Order summary line items must NOT display LKR 0.00
    const lineItemPrices = screen.getAllByText(/LKR/);
    expect(lineItemPrices.length).toBeGreaterThan(0);

    // Subtotal: (4500 * 2) + (5200 * 1) = 9000 + 5200 = 14,200
    const subtotalEl = screen.getByTestId('order-summary-subtotal');
    expect(subtotalEl).toHaveTextContent('LKR 14,200.00');

    // Subtotal >= 10,000 qualifies for free shipping
    const shippingEl = screen.getByTestId('order-summary-shipping');
    expect(shippingEl).toHaveTextContent('FREE');

    // Total Due: 14,200.00
    const totalEl = screen.getByTestId('order-summary-total');
    expect(totalEl).toHaveTextContent('LKR 14,200.00');
    expect(totalEl).not.toHaveTextContent('LKR 0.00');
  });

  it('accurately calculates standard shipping of LKR 450 when order is below LKR 10,000', () => {
    const smallOrderItems = [
      {
        id: 'item-1',
        product_id: 'p-1',
        variant_id: 'var-1',
        title: 'Batik Scarf',
        size: 'One Size',
        color: 'Indigo',
        unit_price: 3500,
        quantity: 1,
        subtotal: 3500,
      },
    ];

    render(
      <ToastProvider>
        <CartProvider initialItems={smallOrderItems}>
          <CheckoutPage />
        </CartProvider>
      </ToastProvider>
    );

    // Subtotal: 3,500.00
    expect(screen.getByTestId('order-summary-subtotal')).toHaveTextContent('LKR 3,500.00');

    // Shipping fee: 450.00
    expect(screen.getByTestId('order-summary-shipping')).toHaveTextContent('LKR 450.00');

    // Total: 3,500 + 450 = 3,950.00
    const totalEl = screen.getByTestId('order-summary-total');
    expect(totalEl).toHaveTextContent('LKR 3,950.00');
    expect(totalEl).not.toHaveTextContent('LKR 0.00');
  });
});
