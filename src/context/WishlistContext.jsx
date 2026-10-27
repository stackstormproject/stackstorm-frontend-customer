import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  wishlistApi,
  getLocalWishlistIds,
  setLocalWishlistIds,
  getLocalWishlistItems,
  setLocalWishlistItems,
  getFallbackWishlist,
} from '../api/wishlist.api';
import { FALLBACK_PRODUCTS } from '../api/product.api';

const WishlistContext = createContext(null);

export function WishlistProvider({
  children,
  requireAuth = false,
  isAuthenticated = true,
  onShowAuthModal = null,
}) {
  const [wishlistItems, setWishlistItems] = useState(() => getFallbackWishlist());
  const [wishlistIds, setWishlistIds] = useState(() => {
    const fallback = getFallbackWishlist();
    if (fallback.length > 0) {
      return fallback.map((it) => it.product_id || it.product?.id || it.id).filter(Boolean);
    }
    return getLocalWishlistIds();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState(null);

  // Sync wishlist items from local fallback or backend API
  const refreshWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await wishlistApi.getWishlist();
      if (Array.isArray(items) && items.length > 0) {
        const normalized = items.map((it) => {
          const prod = it.product || it;
          const prodId = prod.id || it.product_id || it.id;
          return {
            id: `wishlist-${prodId}`,
            product_id: prodId,
            product: {
              ...prod,
              id: prodId,
              title: prod.title || prod.name || 'Artisan Garment',
              base_price:
                prod.base_price !== undefined
                  ? Number(prod.base_price)
                  : prod.price !== undefined
                    ? Number(prod.price)
                    : 0,
              primary_image:
                prod.primary_image ||
                prod.primaryImage ||
                'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
              availableStock: prod.availableStock !== undefined ? prod.availableStock : 25,
            },
            in_stock: (prod.availableStock !== undefined ? prod.availableStock : 25) > 0,
            available_stock: prod.availableStock || 25,
          };
        });
        setWishlistItems(normalized);
        setLocalWishlistItems(normalized);
        const serverIds = normalized.map((it) => it.product_id).filter(Boolean);
        if (serverIds.length > 0) {
          setWishlistIds(serverIds);
          setLocalWishlistIds(serverIds);
        }
      } else {
        const fallbackItems = getFallbackWishlist();
        setWishlistItems(fallbackItems);
        setLocalWishlistItems(fallbackItems);
        const fids = fallbackItems
          .map((it) => it.product_id || it.product?.id || it.id)
          .filter(Boolean);
        setWishlistIds(fids);
        setLocalWishlistIds(fids);
      }
    } catch {
      const fallbackItems = getFallbackWishlist();
      setWishlistItems(fallbackItems);
      setLocalWishlistItems(fallbackItems);
      const fids = fallbackItems
        .map((it) => it.product_id || it.product?.id || it.id)
        .filter(Boolean);
      setWishlistIds(fids);
      setLocalWishlistIds(fids);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isWishlisted = useCallback(
    (productId) =>
      wishlistItems.some(
        (it) => String(it.product_id || it.product?.id || it.id) === String(productId)
      ) || wishlistIds.some((id) => String(id) === String(productId)),
    [wishlistItems, wishlistIds]
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
      const wasWishlisted =
        wishlistItems.some(
          (it) => String(it.product_id || it.product?.id || it.id) === String(productId)
        ) || wishlistIds.some((id) => String(id) === String(productId));

      let nextItems = [];
      let nextIds = [];

      if (wasWishlisted) {
        nextItems = wishlistItems.filter(
          (it) => String(it.product_id || it.product?.id || it.id) !== String(productId)
        );
        nextIds = wishlistIds.filter((id) => String(id) !== String(productId));
      } else {
        const formattedProduct = {
          ...product,
          id: productId,
          title: product.title || product.name || 'Artisan Garment',
          base_price:
            product.base_price !== undefined
              ? Number(product.base_price)
              : product.price !== undefined
                ? Number(product.price)
                : 0,
          primary_image:
            product.primary_image ||
            product.primaryImage ||
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        };
        const newItem = {
          id: `wishlist-${productId}`,
          product_id: productId,
          product: formattedProduct,
          in_stock: (product.availableStock || product.stock_quantity || 0) > 0,
          available_stock: product.availableStock || product.stock_quantity || 25,
        };
        nextItems = [
          ...wishlistItems.filter(
            (it) => String(it.product_id || it.product?.id || it.id) !== String(productId)
          ),
          newItem,
        ];
        nextIds = [...wishlistIds.filter((id) => String(id) !== String(productId)), productId];
      }

      setWishlistItems(nextItems);
      setLocalWishlistItems(nextItems);
      setWishlistIds(nextIds);
      setLocalWishlistIds(nextIds);

      try {
        const res = await wishlistApi.toggleWishlist(productId);
        return res?.wishlisted !== undefined ? res.wishlisted : !wasWishlisted;
      } catch (err) {
        setWishlistIds(wishlistIds);
        setLocalWishlistIds(wishlistIds);
        setWishlistItems(wishlistItems);
        setLocalWishlistItems(wishlistItems);
        refreshWishlist();
        throw err;
      }
    },
    [wishlistIds, wishlistItems, requireAuth, isAuthenticated, onShowAuthModal, refreshWishlist]
  );

  /**
   * Remove item specifically by product ID (AC3)
   */
  const removeFromWishlist = useCallback(
    async (productId) => {
      const nextItems = wishlistItems.filter(
        (it) => String(it.product_id || it.product?.id || it.id) !== String(productId)
      );
      const nextIds = wishlistIds.filter((id) => String(id) !== String(productId));

      setWishlistItems(nextItems);
      setLocalWishlistItems(nextItems);
      setWishlistIds(nextIds);
      setLocalWishlistIds(nextIds);

      try {
        await wishlistApi.removeFromWishlist(productId);
      } catch (err) {
        console.warn('Backend removeFromWishlist error:', err);
      }
    },
    [wishlistItems, wishlistIds]
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
    setLocalWishlistItems([]);
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
    wishlistCount: wishlistItems.length,
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
