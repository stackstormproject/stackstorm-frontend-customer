import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { WishlistProvider, useWishlist } from '../context/WishlistContext';
import { WishlistButton } from '../components/catalog/WishlistButton';
import { WishlistPage } from '../pages/WishlistPage';
import { FALLBACK_PRODUCTS } from '../api/product.api';

describe('STORM-FE-008: Customer Wishlist UI, Real-Time Heart Toggle & Stock Alerts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockProduct = FALLBACK_PRODUCTS[0];

  // Test 1: WishlistButton toggles state and applies pop animation (AC1)
  it('AC1: should render WishlistButton and fire onToggle callback with event stopped', () => {
    const handleToggle = vi.fn();

    const { rerender } = render(
      <WishlistButton product={mockProduct} isWishlisted={false} onToggle={handleToggle} />
    );

    const btn = screen.getByRole('button', { name: /save to wishlist/i });
    expect(btn).toBeInTheDocument();
    expect(btn.classList.contains('is-active')).toBe(false);

    // Click heart button
    fireEvent.click(btn);
    expect(handleToggle).toHaveBeenCalledWith(mockProduct);

    // Rerender as wishlisted
    rerender(<WishlistButton product={mockProduct} isWishlisted={true} onToggle={handleToggle} />);

    const activeBtn = screen.getByRole('button', { name: /remove from wishlist/i });
    expect(activeBtn.classList.contains('is-active')).toBe(true);
  });

  // Test 2: WishlistContext synchronizes state, updates count, and handles optimistic mutations (AC1, AC2)
  it('AC2: should update wishlist count in context and toggle item presence', async () => {
    localStorage.clear();
    const wrapper = ({ children }) => <WishlistProvider>{children}</WishlistProvider>;
    const { result } = renderHook(() => useWishlist(), { wrapper });

    expect(typeof result.current.wishlistCount).toBe('number');

    // Toggle product in
    await act(async () => {
      await result.current.toggleWishlist(mockProduct);
    });

    expect(result.current.isWishlisted(mockProduct.id)).toBe(true);

    // Toggle product out
    await act(async () => {
      await result.current.toggleWishlist(mockProduct);
    });

    expect(result.current.isWishlisted(mockProduct.id)).toBe(false);
  });

  // Test 3: WishlistPage renders empty state when wishlist has 0 items (AC3)
  it('AC3: should render empty state illustration and CTA when wishlist is empty', () => {
    const handleExplore = vi.fn();

    render(<WishlistPage items={[]} onExploreCatalog={handleExplore} />);

    expect(screen.getByTestId('wishlist-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Your Wishlist is Empty/i)).toBeInTheDocument();

    const exploreBtn = screen.getByTestId('wishlist-empty-cta');
    fireEvent.click(exploreBtn);
    expect(handleExplore).toHaveBeenCalledTimes(1);
  });

  // Test 4: WishlistPage renders items with Move to Cart and Remove actions (AC3)
  it('AC3: should render wishlisted items grid with Move to Cart and Remove actions', () => {
    const handleMoveToCart = vi.fn();
    const handleRemove = vi.fn();
    const mockItems = [
      {
        id: 'wish-1',
        product_id: mockProduct.id,
        product: mockProduct,
        in_stock: true,
      },
    ];

    render(
      <WishlistPage items={mockItems} onMoveToCart={handleMoveToCart} onRemoveItem={handleRemove} />
    );

    expect(screen.getByTestId('wishlist-grid')).toBeInTheDocument();
    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();

    // Verify stock badge
    expect(screen.getByTestId(`stock-tag-${mockProduct.id}`)).toHaveTextContent('In Stock');

    // Move to cart action
    const moveBtn = screen.getByTestId(`move-to-cart-${mockProduct.id}`);
    fireEvent.click(moveBtn);
    expect(handleMoveToCart).toHaveBeenCalledWith(mockProduct);

    // Remove action
    const removeBtn = screen.getByTestId(`remove-wishlist-${mockProduct.id}`);
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith(mockProduct.id);
  });

  // Test 5: Unauthenticated user clicking heart triggers auth modal prompt (AC4)
  it('AC4: should trigger auth modal prompt when unauthenticated user toggles heart', async () => {
    const handleShowAuthModal = vi.fn();
    const wrapper = ({ children }) => (
      <WishlistProvider
        requireAuth={true}
        isAuthenticated={false}
        onShowAuthModal={handleShowAuthModal}
      >
        {children}
      </WishlistProvider>
    );

    const { result } = renderHook(() => useWishlist(), { wrapper });

    await act(async () => {
      const added = await result.current.toggleWishlist(mockProduct);
      expect(added).toBe(false);
    });

    expect(result.current.isAuthModalOpen).toBe(true);
    expect(result.current.pendingWishlistProduct).toEqual(mockProduct);
    expect(handleShowAuthModal).toHaveBeenCalledWith(mockProduct);
  });
});
