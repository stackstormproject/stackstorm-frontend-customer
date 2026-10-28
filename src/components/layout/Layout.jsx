import { lazy, Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { SiteHeader, UtilityBar } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ToastViewport } from '../ui/ToastViewport';
import { CartDrawer } from '../cart/CartDrawer';
import { useAuth } from '../../state/AuthContext';
import { getAccessToken } from '../../lib/session';

// Live chat (and socket.io) loads in its own chunk after the page, not in the first bundle.
const ChatWidget = lazy(() => import('../chat/ChatWidget'));

/** Page frame shared by every route. */
export function Layout({ children }) {
  const { customer } = useAuth();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <UtilityBar />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="site-main">
        <Outlet />
      </main>
      <SiteFooter />
      {children}
      <CartDrawer />
      <Suspense fallback={null}>
        <ChatWidget customer={customer} accessToken={customer ? getAccessToken() : null} />
      </Suspense>
      <ToastViewport />
      <ScrollRestoration />
    </>
  );
}
