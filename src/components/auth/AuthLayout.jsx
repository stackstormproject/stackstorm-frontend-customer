import { BrandMark } from '../layout/BrandMark';
import authBanner from '../../assets/auth-banner.jpg';

/**
 * Shared frame for sign in, register and password reset (#186): the photo on the left with
 * the shop's greeting over it, the form framed in a card on the right.
 */
export function AuthLayout({ title, accent, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-banner">
        <img className="auth-banner__image" src={authBanner} alt="" aria-hidden="true" />
        <div className="auth-banner__scrim" aria-hidden="true" />
        <div className="auth-banner__text">
          <p className="auth-banner__eyebrow">Dickwella Fashion Corner</p>
          <p className="auth-banner__title">{title}</p>
          <p className="auth-banner__accent">{accent}</p>
        </div>
      </div>

      <div className="auth-form-side">
        <section className="auth-card">
          <div className="auth-card__badge">
            <BrandMark size={28} />
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
