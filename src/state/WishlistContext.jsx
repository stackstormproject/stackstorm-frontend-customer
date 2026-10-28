import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as wishlistApi from '../api/wishlist';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

/** FR005: the wishlist belongs to signed-in customers and lives on the server. */
export function WishlistProvider({ children }) {
  const { isSignedIn } = useAuth();
  const [products, setProducts] = useState([]);

  const refresh = useCallback(async () => {
    setProducts(await wishlistApi.getWishlist());
  }, []);

  useEffect(() => {
    if (isSignedIn) refresh().catch(() => setProducts([]));
    else setProducts([]);
  }, [isSignedIn, refresh]);

  /** Resolves to true when saved, false when removed. Guests get an AUTH_REQUIRED error. */
  const toggle = useCallback(
    async (productId) => {
      if (!isSignedIn) {
        const error = new Error('Sign in to save items to your wishlist.');
        error.code = 'AUTH_REQUIRED';
        throw error;
      }
      const { wishlisted } = await wishlistApi.toggleWishlist(productId);
      await refresh();
      return wishlisted;
    },
    [isSignedIn, refresh]
  );

  const value = useMemo(() => {
    const ids = new Set(products.map((p) => p.id));
    return { products, isSaved: (id) => ids.has(id), toggle, refresh };
  }, [products, toggle, refresh]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return context;
};
