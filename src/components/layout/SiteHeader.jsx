import { Link, NavLink } from 'react-router-dom';
import { Heart, House, MapPin, ShoppingBag, Truck, User } from 'lucide-react';
import { listCategories } from '../../api/catalog';
import { useResource } from '../../hooks/useResource';
import { useAuth } from '../../state/AuthContext';
import { useCart } from '../../state/CartContext';
import { useWishlist } from '../../state/WishlistContext';
import { BrandMark } from './BrandMark';
import { SearchBox } from './SearchBox';

/** Shop promises and the shop's address, above the sticky header. */
export function UtilityBar() {
  return (
    <div className="utility-bar">
      <div className="container utility-bar__inner">
        <p>
          <Truck size={15} aria-hidden="true" />
          Free islandwide delivery over LKR 10,000
        </p>
        <p className="utility-bar__visit">
          <MapPin size={15} aria-hidden="true" />
          Visit us on Main Street, Dickwella, open daily 9 am to 8 pm
        </p>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const { isSignedIn, customer } = useAuth();
  const { itemCount, openCart } = useCart();
  const { products: saved } = useWishlist();
  const { data: categories } = useResource(listCategories, []);
  const topLevel = (categories || []).filter((c) => !c.parentId);

  return (
    <header className="site-header">
      <div className="site-header__bar container">
        <Link to="/" className="brand" aria-label="Dickwella Fashion Corner, home">
          <BrandMark />
          <span className="brand__text">
            <span className="brand__name">Dickwella</span>
            <span className="brand__sub">Fashion Corner</span>
          </span>
        </Link>

        <SearchBox />

        <nav className="header-actions" aria-label="Your account">
          <Link to={isSignedIn ? '/account' : '/sign-in'} className="header-action">
            {isSignedIn && customer?.avatar_url ? (
              <img src={customer.avatar_url} alt="" className="header-action__avatar" />
            ) : (
              <User size={20} aria-hidden="true" />
            )}
            <span>{isSignedIn ? customer?.name?.split(' ')[0] || 'Account' : 'Sign in'}</span>
          </Link>
          <Link
            to="/account/wishlist"
            className="header-action"
            aria-label={`Wishlist, ${saved.length} saved`}
          >
            <Heart size={20} aria-hidden="true" />
            {saved.length > 0 && <span className="count">{saved.length}</span>}
          </Link>
          <button
            type="button"
            className="header-action header-action--bag"
            onClick={openCart}
            aria-label={`Shopping bag, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            <span className="header-action__label">Bag</span>
            {itemCount > 0 && <span className="count">{itemCount}</span>}
          </button>
        </nav>
      </div>

      <nav className="category-nav" aria-label="Shop by category">
        <ul className="container">
          {/* #187: a way home from every page, not only the logo */}
          <li>
            <NavLink to="/" end className="category-nav__home">
              <House size={16} aria-hidden="true" />
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/shop" end>
              All
            </NavLink>
          </li>
          {topLevel.map((category) => (
            <li key={category.id}>
              <NavLink to={`/shop/${category.slug}`}>{category.name}</NavLink>
            </li>
          ))}
          {/* #192: About us, reachable from every page */}
          <li>
            <NavLink to="/about">About us</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
