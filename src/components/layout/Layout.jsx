import { Outlet, ScrollRestoration } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ToastViewport } from '../ui/ToastViewport';
import ChatWidget from '../chat/ChatWidget';
import { useAuth } from '../../state/AuthContext';
import { getAccessToken } from '../../lib/session';

/** Page frame shared by every route. */
export function Layout({ children }) {
  const { customer } = useAuth();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="site-main">
        <Outlet />
      </main>
      <SiteFooter />
      {children}
      <ChatWidget customer={customer} accessToken={customer ? getAccessToken() : null} />
      <ToastViewport />
      <ScrollRestoration />
    </>
  );
}
