import { Layout } from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import SignInPage from './pages/SignInPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import RegisterPage from './pages/RegisterPage';
import HelpPage from './pages/HelpPage';
import { RequireAuth } from './components/layout/RequireAuth';
import AccountLayout from './pages/account/AccountLayout';
import AccountOverviewPage from './pages/account/AccountOverviewPage';
import OrdersPage from './pages/account/OrdersPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import ReturnsPage from './pages/account/ReturnsPage';
import AddressesPage from './pages/account/AddressesPage';
import WishlistPage from './pages/account/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * URL map. Every page has a real address, so back/forward, refresh and shared links work.
 * Feature tickets add their routes here.
 */
export const routes = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <CatalogPage /> },
      { path: 'shop/:category', element: <CatalogPage /> },
      { path: 'products/:slug', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'orders/:orderId/confirmation', element: <OrderConfirmationPage /> },
      { path: 'sign-in', element: <SignInPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'account',
        element: (
          <RequireAuth>
            <AccountLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <AccountOverviewPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:orderId', element: <OrderDetailPage /> },
          { path: 'returns', element: <ReturnsPage /> },
          { path: 'addresses', element: <AddressesPage /> },
          { path: 'wishlist', element: <WishlistPage /> },
        ],
      },
      { path: 'help/:topic', element: <HelpPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
