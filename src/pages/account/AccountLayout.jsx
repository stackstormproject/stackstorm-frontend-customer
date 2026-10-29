import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import { useToast } from '../../state/ToastContext';

const LINKS = [
  { to: '/account', label: 'Overview', end: true },
  { to: '/account/orders', label: 'Your orders' },
  { to: '/account/returns', label: 'Returns' },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/payment-methods', label: 'Payment methods' },
  { to: '/account/wishlist', label: 'Wishlist' },
];

export default function AccountLayout() {
  const { customer, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const onSignOut = async () => {
    // Leave the protected area first, or the route guard would send us to the sign-in page.
    navigate('/', { replace: true });
    try {
      await signOut();
    } catch {
      // The session is cleared locally either way.
    }
    toast.info('You are signed out.');
  };

  return (
    <div className="container page account">
      <header className="account__header">
        <h1>Hello, {customer?.name?.split(' ')[0] || 'there'}</h1>
        <button type="button" className="btn btn--ghost" onClick={onSignOut}>
          Sign out
        </button>
      </header>
      <div className="account__body">
        <nav aria-label="Account" className="account__nav">
          <ul>
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="account__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
