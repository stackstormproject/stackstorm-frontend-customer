import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistApi, getLocalWishlistIds, setLocalWishlistIds } from '../api/wishlist.api';
import { FALLBACK_PRODUCTS } from '../api/product.api';

const WishlistContext = createContext(null);

export function WishlistProvider({ children, requireAuth = false, isAuthenticated = true, onShowAuthModal = null }) {
  const [wishlistIds, setWishlistIds] = useState(() => getLocalWishlistIds());
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState(null);

  // Sync wishlist items from local fallback or backend API
  const refreshWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await wishlistApi.getWishlist();
      if (Array.isArray(items) && items.length > 0) {
        setWishlistItems(items);
        const serverIds = items.map((it) => it.product_id || it.product?.id).filter(Boolean);
        if (serverIds.length > 0) {
          setWishlistIds(serverIds);
          setLocalWishlistIds(serverIds);
        }
      } else {
        // Hydrate from FALLBACK_PRODUCTS using current wishlistIds
        const local = FALLBACK_PRODUCTS.filter((p) => wishlistIds.includes(p.id)).map((p) => ({
          id: `wishlist-${p.id}`,
          product_id: p.id,
          product: p,
          in_stock: (p.availableStock || 0) > 0,
          available_stock: p.availableStock || 25,
        }));
        setWishlistItems(local);
      }
    } catch {
      const local = FALLBACK_PRODUCTS.filter((p) => wishlistIds.includes(p.id)).map((p) => ({
        id: `wishlist-${p.id}`,
        product_id: p.id,
        product: p,
        in_stock: (p.availableStock || 0) > 0,
        available_stock: p.availableStock || 25,
      }));
      setWishlistItems(local);
    } finally {
      setIsLoading(false);
    }
  }, [wishlistIds]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isWishlisted = useCallback(
    (productId) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  /**
   * Toggle product in wishlist with optimistic UI mutation and rollback on failure (AC1, AC4)
   * @param {Object} product
   */
  const toggleWishlist = useCallback(
    async (product) => {
      if (!product || !product.id) return false;

      // AC4: If user authentication is required and user is not authenticated, prompt auth modal
      if (requireAuth && !isAuthenticated) {
        setPendingWishlistProduct(product);
        setIsAuthModalOpen(true);
        if (onShowAuthModal) onShowAuthModal(product);
        return false;
      }

      const productId = product.id;
      const wasWishlisted = wishlistIds.includes(productId);

      // Optimistic state mutation
      const nextIds = wasWishlisted
        ? wishlistIds.filter((id) => id !== productId)
        : [...wishlistIds, productId];

      setWishlistIds(nextIds);
      setLocalWishlistIds(nextIds);

      // Optimistic update of wishlistItems
      if (wasWishlisted) {
        setWishlistItems((prev) => prev.filter((it) => (it.product_id || it.product?.id) !== productId));
      } else {
        setWishlistItems((prev) => [
          ...prev,
          {
            id: `wishlist-${productId}`,
            product_id: productId,
            product,
            in_stock: (product.availableStock || 0) > 0,
            available_stock: product.availableStock || 25,
          },
        ]);
      }

      try {
        // Dispatch backend call asynchronously
        const res = await wishlistApi.toggleWishlist(productId);
        return res?.wishlisted !== undefined ? res.wishlisted : !wasWishlisted;
      } catch (err) {
        // Rollback optimistic state on failure (Failure Recovery Matrix)
        setWishlistIds(wishlistIds);
        setLocalWishlistIds(wishlistIds);
        refreshWishlist();
        throw err;
      }
    },
    [wishlistIds, requireAuth, isAuthenticated, onShowAuthModal, refreshWishlist]
  );

  /**
   * Remove item specifically by product ID (AC3)
   */
  const removeFromWishlist = useCallback(
    async (productId) => {
      const nextIds = wishlistIds.filter((id) => id !== productId);
      setWishlistIds(nextIds);
      setLocalWishlistIds(nextIds);
      setWishlistItems((prev) => prev.filter((it) => (it.product_id || it.product?.id) !== productId));

      try {
        await wishlistApi.removeFromWishlist(productId);
      } catch (err) {
        console.warn('Backend removeFromWishlist error:', err);
      }
    },
    [wishlistIds]
  );

  /**
   * Move item from wishlist to shopping cart (AC3)
   */
  const moveToCart = useCallback(
    (product, onAddToCart) => {
      if (onAddToCart) {
        onAddToCart(product);
      }
      removeFromWishlist(product.id);
    },
    [removeFromWishlist]
  );

  /**
   * Clear all items
   */
  const clearWishlist = useCallback(() => {
    setWishlistIds([]);
    setWishlistItems([]);
    setLocalWishlistIds([]);
  }, []);

  /**
   * Resume pending wishlist addition once authenticated
   */
  const resumePendingWishlist = useCallback(() => {
    if (pendingWishlistProduct) {
      toggleWishlist(pendingWishlistProduct);
      setPendingWishlistProduct(null);
      setIsAuthModalOpen(false);
    }
  }, [pendingWishlistProduct, toggleWishlist]);

  const value = {
    wishlistIds,
    wishlistItems,
    wishlistCount: wishlistIds.length,
    isLoading,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    moveToCart,
    clearWishlist,
    isAuthModalOpen,
    setIsAuthModalOpen,
    pendingWishlistProduct,
    resumePendingWishlist,
    refreshWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

export default WishlistContext;
