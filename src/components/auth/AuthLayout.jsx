import { Link } from 'react-router-dom';
import { Gift, Heart, MapPin, Package, RotateCcw, Truck } from 'lucide-react';
import { AuthArt } from './AuthArt';

const BENEFITS = [
  [Package, 'Track your orders', 'Live delivery updates'],
  [Gift, 'Earn loyalty points', 'Points on every purchase'],
  [Heart, 'Save to wishlist', 'Never lose track of an item'],
  [RotateCcw, 'Easy returns', 'Ask for a return in one click'],
  [MapPin, 'Saved addresses', 'Faster checkout every time'],
];

/**
 * Shared frame for sign in, register and password reset (#186): a greeting over the shop's
 * illustrated background, the form in a bordered card, and why an account helps.
 */
export function AuthLayout({ title, accent, children }) {
  return (
    <div className="auth-shell">
      <div className="container auth-shell__grid">
        <div className="auth-hero">
          <p className="auth-hero__title">
            {title}
            <span>{accent}</span>
          </p>
          <AuthArt />
        </div>

        <section className="auth-card">{children}</section>

        <aside className="auth-aside" aria-label="About accounts">
          <div className="auth-panel">
            <h2 className="auth-panel__title">Why create an account?</h2>
            <ul className="auth-benefits">
              {BENEFITS.map(([Icon, label, detail]) => (
                <li key={label}>
                  <Icon size={20} aria-hidden="true" />
                  <span>
                    <strong>{label}</strong>
                    {detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="auth-panel">
            <h2 className="auth-panel__title">Need help?</h2>
            <ul className="auth-help">
              <li>
                <Truck size={16} aria-hidden="true" />
                <Link to="/help/delivery">Delivery and collection</Link>
              </li>
              <li>
                <RotateCcw size={16} aria-hidden="true" />
                <Link to="/help/returns">Returns and exchanges</Link>
              </li>
              <li>
                <MapPin size={16} aria-hidden="true" />
                <span>Main Street, Dickwella, open daily 9 am to 8 pm</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
