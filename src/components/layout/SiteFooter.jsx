import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <p className="site-footer__brand">Dickwella Fashion Corner</p>
          <p>Main Street, Dickwella, Matara 81200</p>
          <p>Open daily, 9 am to 8 pm</p>
        </div>
        <div>
          <h2 className="site-footer__heading">Help</h2>
          <ul>
            <li>
              <Link to="/help/delivery">Delivery and collection</Link>
            </li>
            <li>
              <Link to="/help/returns">Returns within 30 days</Link>
            </li>
            <li>
              <Link to="/account/orders">Track an order</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="site-footer__heading">Shop</h2>
          <ul>
            <li>
              <Link to="/shop/men">Men</Link>
            </li>
            <li>
              <Link to="/shop/women">Women</Link>
            </li>
            <li>
              <Link to="/shop/kids">Kids</Link>
            </li>
            <li>
              <Link to="/shop/accessories">Accessories</Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="container site-footer__legal">
        © {new Date().getFullYear()} Dickwella Fashion Corner. Prices in Sri Lankan rupees.
      </p>
    </footer>
  );
}
