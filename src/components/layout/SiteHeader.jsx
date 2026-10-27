import { useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';
import { listCategories } from '../../api/catalog';
import { useResource } from '../../hooks/useResource';
import { useAuth } from '../../state/AuthContext';
import { useCart } from '../../state/CartContext';
import { useWishlist } from '../../state/WishlistContext';

export function SiteHeader() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('search') || '');
  const { isSignedIn, customer } = useAuth();
  const { itemCount, openCart } = useCart();
  const { products: saved } = useWishlist();
  const { data: categories } = useResource(listCategories, []);
  const topLevel = (categories || []).filter((c) => !c.parentId);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/shop?search=${encodeURIComponent(term)}` : '/shop');
  };

  return (
    <header className="site-header">
      <div className="site-header__bar container">
        <Link to="/" className="brand" aria-label="Dickwella Fashion Corner, home">
          <span className="brand__name">Dickwella</span>
          <span className="brand__sub">Fashion Corner</span>
        </Link>

        <form className="search" role="search" onSubmit={submitSearch}>
          <label htmlFor="site-search" className="visually-hidden">
            Search products
          </label>
          <input
            id="site-search"
            type="search"
            placeholder="Search batik, sarees, linen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search__button" aria-label="Search">
            <Search size={18} aria-hidden="true" />
          </button>
        </form>

        <nav className="header-actions" aria-label="Your account">
          <Link to={isSignedIn ? '/account' : '/sign-in'} className="header-action">
            <User size={20} aria-hidden="true" />
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
            className="header-action"
            onClick={openCart}
            aria-label={`Shopping bag, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            {itemCount > 0 && <span className="count">{itemCount}</span>}
          </button>
        </nav>
      </div>

      <nav className="category-nav" aria-label="Shop by category">
        <ul className="container">
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
        </ul>
      </nav>
      <div className="warp-stripe" aria-hidden="true" />
    </header>
  );
}
