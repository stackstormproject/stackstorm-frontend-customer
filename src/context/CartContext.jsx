import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { cartApi } from '../api/cart.api';
import { getGuestSessionId } from '../api/client';

const CART_STORAGE_KEY = 'stackstorm_cart_items';
const FREE_SHIPPING_THRESHOLD = 10000;
const STANDARD_SHIPPING_FEE = 450;

const CartContext = createContext(null);

export function CartProvider({ children, initialItems = null }) {
  const [items, setItems] = useState(() => {
    if (initialItems) return initialItems;
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscountRate, setPromoDiscountRate] = useState(0); // 0.1 for 10%, etc.
  const [promoError, setPromoError] = useState('');

  // Debounce timers reference map for AC3 & 429 Rate Limit mitigation
  const debounceTimers = useRef({});

  // Synchronize items with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save cart to localStorage:', err);
    }
  }, [items]);

  // Drawer control actions (AC1)
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  /**
   * Add item to cart with optimistic local insertion (AC2)
   */
  const addItem = useCallback((product, variant = null, quantity = 1) => {
    if (!product) return;

    const unitPrice = variant?.price_override || product.base_price || 0;
    const variantId = variant?.id || `var-${product.id}`;
    const size = variant?.size || product.sizes?.[0] || 'M';
    const color = variant?.color || product.colors?.[0] || 'Ocean Blue';
    const sku = variant?.sku || `${(product.slug || 'PRD').substring(0, 8).toUpperCase()}-${size}`;
    const imgUrl = product.primary_image || (product.images && product.images[0]?.image_url);

    // Identify if matching product + size + color already exists in cart
    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex(
        (it) => it.product_id === product.id && it.size === size && it.color === color
      );

      if (existingIdx > -1) {
        const next = [...prevItems];
        const existing = next[existingIdx];
        const updatedQty = existing.quantity + quantity;
        next[existingIdx] = {
          ...existing,
          quantity: updatedQty,
          subtotal: existing.unit_price * updatedQty,
        };
        return next;
      }

      const newItem = {
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: product.id,
        variant_id: variantId,
        sku,
        title: product.title,
        size,
        color,
        unit_price: unitPrice,
        quantity,
        subtotal: unitPrice * quantity,
        image_url: imgUrl,
        available_stock:
          variant?.available_stock !== undefined
            ? variant.available_stock
            : product.availableStock || 30,
      };

      return [...prevItems, newItem];
    });

    // Auto-open drawer for instant feedback
    setIsOpen(true);

    // Dispatches network call asynchronously
    cartApi
      .addItem({
        variantId,
        quantity,
      })
      .catch((err) => {
        console.warn('Backend cart addItem error:', err);
      });
  }, []);

  /**
   * Update line item quantity with 300ms debounce (AC3, Failure Recovery Matrix)
   */
  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    // 1. Immediate optimistic UI update
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const boundedQty = item.available_stock
            ? Math.min(newQuantity, item.available_stock)
            : newQuantity;
          return {
            ...item,
            quantity: boundedQty,
            subtotal: item.unit_price * boundedQty,
          };
        }
        return item;
      })
    );

    // 2. Clear existing debounce timer for this specific line item
    if (debounceTimers.current[itemId]) {
      clearTimeout(debounceTimers.current[itemId]);
    }

    // 3. Set 300ms debounce before firing network PUT
    debounceTimers.current[itemId] = setTimeout(() => {
      cartApi.updateItem(itemId, newQuantity).catch((err) => {
        console.warn('Backend updateItem error:', err);
      });
      delete debounceTimers.current[itemId];
    }, 300);
  }, []);

  /**
   * Remove item from cart immediately (AC2)
   */
  const removeItem = useCallback((itemId) => {
    if (debounceTimers.current[itemId]) {
      clearTimeout(debounceTimers.current[itemId]);
      delete debounceTimers.current[itemId];
    }

    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

    cartApi.removeItem(itemId).catch((err) => {
      console.warn('Backend removeItem error:', err);
    });
  }, []);

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(() => {
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
    setItems([]);

    cartApi.clearCart().catch((err) => {
      console.warn('Backend clearCart error:', err);
    });
  }, []);

  /**
   * Apply promotional coupon code
   */
  const applyPromoCode = useCallback((code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    setPromoCode(cleanCode);

    if (cleanCode === 'DICKWELLA10') {
      setPromoDiscountRate(0.1);
      setPromoError('');
      return { success: true, message: '10% Southern Province Heritage Discount Applied!' };
    }
    if (cleanCode === 'BATIK20') {
      setPromoDiscountRate(0.2);
      setPromoError('');
      return { success: true, message: '20% Artisan Batik Voucher Applied!' };
    }

    setPromoDiscountRate(0);
    setPromoError('Invalid coupon code. Try "DICKWELLA10" or "BATIK20".');
    return { success: false, message: 'Invalid coupon code.' };
  }, []);

  /**
   * Merge guest session cart into user account on login (AC4)
   */
  const mergeGuestCart = useCallback(async () => {
    const guestSessionId = getGuestSessionId();
    try {
      await cartApi.mergeCart(guestSessionId);
    } catch (err) {
      console.warn('Guest cart merge notice:', err);
    }
  }, []);

  // Financial aggregates
  const totalItems = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const subtotal = items.reduce((sum, it) => sum + it.unit_price * (it.quantity || 1), 0);
  const discountAmount = Math.round(subtotal * promoDiscountRate);
  const discountedSubtotal = subtotal - discountAmount;
  const isFreeShipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD || discountedSubtotal === 0;
  const shippingFee = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const total = discountedSubtotal + shippingFee;
  const freeShippingProgress = Math.min(
    100,
    Math.round((discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);

  const value = {
    items,
    isOpen,
    totalItems,
    subtotal,
    discountAmount,
    discountedSubtotal,
    shippingFee,
    total,
    isFreeShipping,
    freeShippingProgress,
    amountToFreeShipping,
    promoCode,
    promoDiscountRate,
    promoError,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyPromoCode,
    mergeGuestCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
