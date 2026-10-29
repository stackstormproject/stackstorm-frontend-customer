import { lazy, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { LoadingState } from './components/ui/States';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import SalePage from './pages/SalePage';
import ProductPage from './pages/ProductPage';
import SignInPage from './pages/SignInPage';
import CartPage from './pages/CartPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HelpPage from './pages/HelpPage';
import AboutPage from './pages/AboutPage';
import { RequireAuth } from './components/layout/RequireAuth';
import NotFoundPage from './pages/NotFoundPage';

// Checkout (Stripe) and the account area load on demand to keep the first page small (NFR002).
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const CheckoutCompletePage = lazy(() => import('./pages/CheckoutCompletePage'));
const TestGatewayPage = lazy(() => import('./pages/TestGatewayPage'));
const AccountLayout = lazy(() => import('./pages/account/AccountLayout'));
const AccountOverviewPage = lazy(() => import('./pages/account/AccountOverviewPage'));
const OrdersPage = lazy(() => import('./pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/account/OrderDetailPage'));
const ReturnsPage = lazy(() => import('./pages/account/ReturnsPage'));
const AddressesPage = lazy(() => import('./pages/account/AddressesPage'));
const WishlistPage = lazy(() => import('./pages/account/WishlistPage'));
const PaymentMethodsPage = lazy(() => import('./pages/account/PaymentMethodsPage'));

const page = (element) => <Suspense fallback={<LoadingState />}>{element}</Suspense>;

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
      { path: 'sale', element: <SalePage /> },
      { path: 'products/:slug', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: page(<CheckoutPage />) },
      { path: 'checkout/complete', element: page(<CheckoutCompletePage />) },
      { path: 'orders/:orderId/confirmation', element: page(<OrderConfirmationPage />) },
      { path: 'sign-in', element: <SignInPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      {
        path: 'account',
        element: <RequireAuth>{page(<AccountLayout />)}</RequireAuth>,
        children: [
          { index: true, element: page(<AccountOverviewPage />) },
          { path: 'orders', element: page(<OrdersPage />) },
          { path: 'orders/:orderId', element: page(<OrderDetailPage />) },
          { path: 'returns', element: page(<ReturnsPage />) },
          { path: 'addresses', element: page(<AddressesPage />) },
          { path: 'wishlist', element: page(<WishlistPage />) },
          { path: 'payment-methods', element: page(<PaymentMethodsPage />) },
        ],
      },
      { path: 'help/:topic', element: <HelpPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // The test payment gateway stands alone, like the real hosted payment page (#182).
  { path: 'checkout/test-gateway', element: page(<TestGatewayPage />) },
];
