import { Link } from 'react-router-dom';
import { Hand, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { BrandMark } from './BrandMark';

const PROMISES = [
  { Icon: Truck, title: 'Free islandwide delivery', text: 'On orders over LKR 10,000' },
  { Icon: RotateCcw, title: 'Returns within 30 days', text: 'Exchange a size or get a refund' },
  { Icon: ShieldCheck, title: 'Secure card payment', text: 'Card details never touch our server' },
  { Icon: Hand, title: 'Made in Dickwella', text: 'Woven and dyed on the south coast' },
];

const SHOP_LINKS = [
  ['Men', '/shop/men'],
  ['Women', '/shop/women'],
  ['Kids', '/shop/kids'],
  ['Accessories', '/shop/accessories'],
];

const HELP_LINKS = [
  ['Delivery and collection', '/help/delivery'],
  ['Returns and exchanges', '/help/returns'],
  ['Track an order', '/account/orders'],
  ['Your account', '/account'],
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <section className="promises" aria-label="Our promises">
        <ul className="container promises__list">
          {PROMISES.map(({ Icon, title, text }) => (
            <li key={title} className="promise">
              <span className="promise__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span>
                <strong>{title}</strong>
                <span className="promise__text">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="site-footer__main">
        <div className="warp-stripe" aria-hidden="true" />
        <div className="container site-footer__grid">
          <div className="site-footer__about">
            <p className="site-footer__brand">
              <BrandMark size={36} />
              Dickwella Fashion Corner
            </p>
            <p>
              A family shop selling batik, handloom and linen clothing made on Sri Lanka’s south
              coast.
            </p>
            <address>
              Main Street, Dickwella, Matara 81200
              <br />
              Open daily, 9 am to 8 pm
            </address>
          </div>
          <nav aria-label="Shop">
            <h2 className="site-footer__heading">Shop</h2>
            <ul>
              {SHOP_LINKS.map(([label, to]) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Help">
            <h2 className="site-footer__heading">Help</h2>
            <ul>
              {HELP_LINKS.map(([label, to]) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="site-footer__heading">Find the shop</h2>
            <p>Collect your order in store at no charge, or come in to try a size.</p>
            <a
              className="site-footer__map"
              href="https://www.openstreetmap.org/search?query=Dickwella%2C%20Sri%20Lanka"
              target="_blank"
              rel="noreferrer"
            >
              Open the map
            </a>
          </div>
        </div>
        <div className="container site-footer__legal">
          <p>
            © {new Date().getFullYear()} Dickwella Fashion Corner. Prices in Sri Lankan rupees.
          </p>
          <p className="site-footer__pay">We accept Visa and Mastercard</p>
        </div>
      </div>
    </footer>
  );
}
