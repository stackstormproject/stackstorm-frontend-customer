import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as cartApi from '../api/cart';
import { getGuestCartToken, resetGuestCartToken } from '../lib/session';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const FREE_SHIPPING_THRESHOLD = 10000; // LKR, same rule as checkout.service
export const STANDARD_SHIPPING_FEE = 450;

/**
 * The server is the source of truth for the cart. Every mutation is sent to the API and the
 * cart is re-read, so prices and stock shown are always the server's. Failures are thrown to
 * the caller (to show a message) instead of being hidden.
 */
export function CartProvider({ children }) {
  const { status, customer } = useAuth();
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState('idle'); // idle | loading | ready | error
  const [isOpen, setIsOpen] = useState(false);
  const [pendingItemId, setPendingItemId] = useState(null);
  const mergedFor = useRef(null);

  const refresh = useCallback(async () => {
    setLoadState((s) => (s === 'ready' ? s : 'loading'));
    try {
      setItems(await cartApi.getCart());
      setLoadState('ready');
    } catch (error) {
      setLoadState('error');
      throw error;
    }
  }, []);

  useEffect(() => {
    if (status === 'checking') return;
    const customerId = customer?.id ?? null;
    const sync = async () => {
      // After sign-in, move anything the shopper added as a guest into their own cart.
      if (customerId && mergedFor.current !== customerId) {
        mergedFor.current = customerId;
        try {
          await cartApi.mergeGuestCart(getGuestCartToken());
          resetGuestCartToken();
        } catch {
          // Nothing to merge or merge refused: the customer cart below is still correct.
        }
      }
      if (!customerId) mergedFor.current = null;
      await refresh();
    };
    sync().catch(() => {});
  }, [status, customer?.id, refresh]);

  const mutate = useCallback(
    async (itemId, action) => {
      setPendingItemId(itemId);
      try {
        await action();
        await refresh();
      } finally {
        setPendingItemId(null);
      }
    },
    [refresh]
  );

  const addItem = useCallback(
    (variantId, quantity = 1) =>
      mutate(`new-${variantId}`, () => cartApi.addCartItem(variantId, quantity)),
    [mutate]
  );
  const updateQuantity = useCallback(
    (itemId, quantity) => mutate(itemId, () => cartApi.updateCartItem(itemId, quantity)),
    [mutate]
  );
  const removeItem = useCallback(
    (itemId) => mutate(itemId, () => cartApi.removeCartItem(itemId)),
    [mutate]
  );

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
    return {
      items,
      itemCount,
      subtotal,
      loadState,
      pendingItemId,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      refresh,
      addItem,
      updateQuantity,
      removeItem,
      hasUnavailableItems: items.some((item) => item.quantity > item.available_stock),
    };
  }, [items, loadState, pendingItemId, isOpen, refresh, addItem, updateQuantity, removeItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};
