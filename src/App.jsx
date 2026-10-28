import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './state/AuthContext';
import { CartProvider } from './state/CartContext';
import { WishlistProvider } from './state/WishlistContext';
import { ToastProvider } from './state/ToastContext';

export function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default function App({ router }) {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
