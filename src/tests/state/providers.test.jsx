import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../state/AuthContext';
import { CartProvider, useCart } from '../../state/CartContext';
import { WishlistProvider, useWishlist } from '../../state/WishlistContext';
import { ToastProvider, useToast } from '../../state/ToastContext';
import * as authApi from '../../api/auth';
import * as cartApi from '../../api/cart';
import * as wishlistApi from '../../api/wishlist';
import { setAccessToken } from '../../lib/session';

vi.mock('../../api/auth');
vi.mock('../../api/cart');
vi.mock('../../api/wishlist');

const wrap = ({ restore = () => Promise.resolve(null) } = {}) =>
  function Providers({ children }) {
    return (
      <AuthProvider restore={restore}>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </AuthProvider>
    );
  };

const useAll = () => ({ auth: useAuth(), cart: useCart(), wishlist: useWishlist() });

const line = (overrides = {}) => ({
  id: 1,
  variant_id: 7,
  quantity: 2,
  line_total: 9000,
  available_stock: 5,
  product: { name: 'Batik Shirt' },
  ...overrides,
});

describe('AuthProvider', () => {
  beforeEach(() => {
    cartApi.getCart.mockResolvedValue([]);
    wishlistApi.getWishlist.mockResolvedValue([]);
  });

  it('should restore a customer from the refresh cookie', async () => {
    const { result } = renderHook(useAll, {
      wrapper: wrap({ restore: () => Promise.resolve({ id: 4, name: 'Nimal' }) }),
    });

    expect(result.current.auth.status).toBe('checking');
    await waitFor(() => expect(result.current.auth.status).toBe('customer'));
    expect(result.current.auth.customer.name).toBe('Nimal');
  });

  it('should become a guest given no valid refresh cookie', async () => {
    const { result } = renderHook(useAll, {
      wrapper: wrap({ restore: () => Promise.reject(new Error('401')) }),
    });

    await waitFor(() => expect(result.current.auth.status).toBe('guest'));
  });

  it('should sign in, sign up and sign out', async () => {
    authApi.login.mockResolvedValue({ id: 4 });
    authApi.register.mockResolvedValue({ id: 5 });
    authApi.logout.mockResolvedValue();
    cartApi.mergeGuestCart.mockResolvedValue({});
    const { result } = renderHook(useAll, { wrapper: wrap() });
    await waitFor(() => expect(result.current.auth.status).toBe('guest'));

    await act(() => result.current.auth.signIn({ email: 'a', password: 'b' }));
    expect(result.current.auth.isSignedIn).toBe(true);
    await act(() => result.current.auth.signOut());
    expect(result.current.auth.status).toBe('guest');
    await act(() => result.current.auth.signUp({ name: 'N' }));
    expect(result.current.auth.customer).toEqual({ id: 5 });
  });

  it('should drop to guest when the session token is cleared mid-session', async () => {
    const { result } = renderHook(useAll, {
      wrapper: wrap({ restore: () => Promise.resolve({ id: 4 }) }),
    });
    await waitFor(() => expect(result.current.auth.status).toBe('customer'));

    act(() => setAccessToken(null));

    expect(result.current.auth.status).toBe('guest');
  });

  it('should require the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(useAuth)).toThrow(/AuthProvider/);
    expect(() => renderHook(useCart)).toThrow(/CartProvider/);
    expect(() => renderHook(useWishlist)).toThrow(/WishlistProvider/);
    expect(() => renderHook(useToast)).toThrow(/ToastProvider/);
  });
});

describe('CartProvider', () => {
  beforeEach(() => {
    wishlistApi.getWishlist.mockResolvedValue([]);
  });

  it('should load the server cart and compute count and subtotal', async () => {
    cartApi.getCart.mockResolvedValue([line(), line({ id: 2, quantity: 1, line_total: 1500 })]);
    const { result } = renderHook(useAll, { wrapper: wrap() });

    await waitFor(() => expect(result.current.cart.loadState).toBe('ready'));
    expect(result.current.cart.itemCount).toBe(3);
    expect(result.current.cart.subtotal).toBe(10500);
    expect(result.current.cart.hasUnavailableItems).toBe(false);
  });

  it('should flag lines that ask for more than is available', async () => {
    cartApi.getCart.mockResolvedValue([line({ quantity: 6, available_stock: 2 })]);
    const { result } = renderHook(useAll, { wrapper: wrap() });

    await waitFor(() => expect(result.current.cart.hasUnavailableItems).toBe(true));
  });

  it('should re-read the cart after each change', async () => {
    cartApi.getCart.mockResolvedValue([]);
    cartApi.addCartItem.mockResolvedValue({});
    cartApi.updateCartItem.mockResolvedValue({});
    cartApi.removeCartItem.mockResolvedValue({});
    const { result } = renderHook(useAll, { wrapper: wrap() });
    await waitFor(() => expect(result.current.cart.loadState).toBe('ready'));

    await act(() => result.current.cart.addItem(7, 2));
    await act(() => result.current.cart.updateQuantity(1, 3));
    await act(() => result.current.cart.removeItem(1));

    expect(cartApi.addCartItem).toHaveBeenCalledWith(7, 2);
    expect(cartApi.updateCartItem).toHaveBeenCalledWith(1, 3);
    expect(cartApi.removeCartItem).toHaveBeenCalledWith(1);
    expect(cartApi.getCart).toHaveBeenCalledTimes(4);
  });

  it('should surface a failed change instead of hiding it', async () => {
    cartApi.getCart.mockResolvedValue([]);
    cartApi.addCartItem.mockRejectedValue(Object.assign(new Error('Only 1 left'), { status: 409 }));
    const { result } = renderHook(useAll, { wrapper: wrap() });
    await waitFor(() => expect(result.current.cart.loadState).toBe('ready'));

    await expect(act(() => result.current.cart.addItem(7, 5))).rejects.toThrow('Only 1 left');
    expect(result.current.cart.pendingItemId).toBeNull();
  });

  it('should merge the guest cart once after sign-in', async () => {
    cartApi.getCart.mockResolvedValue([]);
    cartApi.mergeGuestCart.mockResolvedValue({ mergedCount: 1 });
    const { result } = renderHook(useAll, {
      wrapper: wrap({ restore: () => Promise.resolve({ id: 4 }) }),
    });

    await waitFor(() => expect(cartApi.mergeGuestCart).toHaveBeenCalledTimes(1));
    expect(cartApi.mergeGuestCart.mock.calls[0][0]).toMatch(/^guest_/);
    await waitFor(() => expect(result.current.cart.loadState).toBe('ready'));
  });

  it('should still load the customer cart when merge fails', async () => {
    cartApi.getCart.mockResolvedValue([line()]);
    cartApi.mergeGuestCart.mockRejectedValue(new Error('nothing to merge'));
    const { result } = renderHook(useAll, {
      wrapper: wrap({ restore: () => Promise.resolve({ id: 4 }) }),
    });

    await waitFor(() => expect(result.current.cart.itemCount).toBe(2));
  });

  it('should report a load failure', async () => {
    cartApi.getCart.mockRejectedValue(new Error('down'));
    const { result } = renderHook(useAll, { wrapper: wrap() });

    await waitFor(() => expect(result.current.cart.loadState).toBe('error'));
  });

  it('should open and close the drawer', async () => {
    cartApi.getCart.mockResolvedValue([]);
    const { result } = renderHook(useAll, { wrapper: wrap() });

    act(() => result.current.cart.openCart());
    expect(result.current.cart.isOpen).toBe(true);
    act(() => result.current.cart.closeCart());
    expect(result.current.cart.isOpen).toBe(false);
  });
});

describe('WishlistProvider', () => {
  beforeEach(() => {
    cartApi.getCart.mockResolvedValue([]);
    cartApi.mergeGuestCart.mockResolvedValue({});
  });

  it('should ask guests to sign in', async () => {
    const { result } = renderHook(useAll, { wrapper: wrap() });
    await waitFor(() => expect(result.current.auth.status).toBe('guest'));

    await expect(result.current.wishlist.toggle(3)).rejects.toMatchObject({
      code: 'AUTH_REQUIRED',
    });
    expect(wishlistApi.toggleWishlist).not.toHaveBeenCalled();
  });

  it('should load and toggle saved products for a customer', async () => {
    wishlistApi.getWishlist.mockResolvedValue([{ id: 3 }]);
    wishlistApi.toggleWishlist.mockResolvedValue({ wishlisted: false });
    const { result } = renderHook(useAll, {
      wrapper: wrap({ restore: () => Promise.resolve({ id: 4 }) }),
    });
    await waitFor(() => expect(result.current.wishlist.isSaved(3)).toBe(true));

    let saved;
    await act(async () => {
      saved = await result.current.wishlist.toggle(3);
    });

    expect(saved).toBe(false);
    expect(wishlistApi.toggleWishlist).toHaveBeenCalledWith(3);
  });

  it('should fall back to an empty list when loading fails', async () => {
    wishlistApi.getWishlist.mockRejectedValue(new Error('x'));
    const { result } = renderHook(useAll, {
      wrapper: wrap({ restore: () => Promise.resolve({ id: 4 }) }),
    });

    await waitFor(() => expect(result.current.auth.isSignedIn).toBe(true));
    expect(result.current.wishlist.products).toEqual([]);
  });
});

describe('ToastProvider', () => {
  function Trigger() {
    const toast = useToast();
    return (
      <>
        <button type="button" onClick={() => toast.success('Added to bag')}>
          ok
        </button>
        <button type="button" onClick={() => toast.error('Payment failed')}>
          bad
        </button>
        <button type="button" onClick={() => toast.info('Note')}>
          info
        </button>
        <ul>
          {toast.toasts.map((t) => (
            <li key={t.id}>{`${t.tone}:${t.message}`}</li>
          ))}
        </ul>
      </>
    );
  }

  it('should show toasts, keep at most three and expire them', async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('ok').click();
      screen.getByText('bad').click();
      screen.getByText('info').click();
      screen.getByText('ok').click();
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('error:Payment failed')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(8000));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    vi.useRealTimers();
  });
});
