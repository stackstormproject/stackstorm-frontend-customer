import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { categoryApi } from '../../api/category.api';
import { MegaMenu } from './MegaMenu';
import './Header.css';

export const Header = ({
  wishlistCount = 0,
  cartCount = 0,
  currentUser = null,
  onSearch,
  onWishlistClick,
  onCartClick,
  onAccountClick,
  onCategorySelect,
  categories: initialCategories,
  onHomeClick = null,
}) => {
  const [categories, setCategories] = useState(initialCategories || []);
  const [activeMegaCategory, setActiveMegaCategory] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [expandedMobileCat, setExpandedMobileCat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
      return;
    }

    let isMounted = true;
    categoryApi.getCategories().then((data) => {
      if (isMounted && data) {
        setCategories(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [initialCategories]);

  // Mega-menu hover management with slight delay for silky smooth interaction
  const handleCategoryMouseEnter = (cat) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setActiveMegaCategory(cat);
  };

  const handleCategoryMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMegaCategory(null);
    }, 220);
  };

  const handleMegaMenuMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const toggleMobileCategory = (catId) => {
    setExpandedMobileCat((prev) => (prev === catId ? null : catId));
  };

  return (
    <header className="dk-header-root" data-testid="storefront-header">
      {/* Main Storefront Header Bar */}
      <div className="dk-main-header" onMouseLeave={handleCategoryMouseLeave}>
        {/* Top Header Row with Centered Logo */}
        <div className="container dk-header-top-row">
          {/* Left: Mobile Toggle & Responsive Search */}
          <div className="dk-header-left">
            <button
              type="button"
              className="dk-mobile-toggle"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open mobile menu"
              data-testid="mobile-menu-toggle"
            >
              <Menu size={22} />
            </button>

            <form className="dk-header-search" onSubmit={handleSearchSubmit} role="search">
              <input
                type="search"
                className="dk-search-input"
                placeholder="Search handloom & batik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search clothing catalog"
                data-testid="header-search-input"
              />
              <button
                type="submit"
                className="action-btn"
                aria-label="Search Catalog"
                title="Search Catalog"
                style={{
                  position: 'absolute',
                  right: '4px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-text-subtle)',
                }}
                data-testid="header-search-submit"
              >
                <Search size={15} />
              </button>
            </form>
          </div>

          {/* Center: Brand Identity — STACKSTORM over Dickwella Fashion Corner (Black & Centered) */}
          <div className="dk-brand-group">
            <div className="dk-brand-identity">
              <a
                href="/"
                className="dk-brand-title"
                data-testid="header-brand-logo"
                onClick={(e) => {
                  e.preventDefault();
                  if (onHomeClick) {
                    onHomeClick();
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <span className="dk-brand-main">STACKSTORM</span>
                <span className="dk-brand-sub">Dickwella Fashion Corner</span>
              </a>
            </div>
          </div>

          {/* Right: Action Badges (Wishlist, Cart & Account) */}
          <div className="dk-header-actions">

            <button
              type="button"
              className="dk-action-btn"
              onClick={onWishlistClick}
              aria-label="View Wishlist"
              title="View Wishlist"
              data-testid="header-wishlist-btn"
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className="dk-action-badge" data-testid="wishlist-badge">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className="dk-action-btn"
              onClick={onCartClick}
              aria-label="View Shopping Cart"
              title="View Shopping Cart"
              data-testid="header-cart-btn"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="dk-action-badge" data-testid="cart-badge">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className="dk-account-btn"
              onClick={onAccountClick}
              aria-label="Customer Account"
              data-testid="header-account-btn"
            >
              <User size={16} />
              <span>{currentUser ? (currentUser.first_name || currentUser.name || 'My Profile') : 'Sign In'}</span>
            </button>
          </div>
        </div>

        {/* Centered Desktop Category Navigation */}
        <div className="dk-header-nav-row">
          <div className="container dk-nav-container">
            <nav className="dk-nav-desktop" aria-label="Main Navigation">
              {categories.map((category) => {
                const hasChildren = category.children && category.children.length > 0;
                const isActive = activeMegaCategory?.id === category.id;

                return (
                  <div
                    key={category.id || category.slug}
                    className="dk-nav-item"
                    onMouseEnter={() => handleCategoryMouseEnter(category)}
                  >
                    <button
                      type="button"
                      className={`dk-nav-button ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (onCategorySelect) onCategorySelect(category);
                      }}
                      aria-expanded={isActive}
                      aria-haspopup={hasChildren ? 'true' : 'false'}
                      data-testid={`nav-item-${category.slug}`}
                    >
                      <span>{category.name}</span>
                      {hasChildren && <ChevronDown size={14} style={{ opacity: 0.7 }} />}
                    </button>
                  </div>
                );
              })}

              {/* Quick Apparel Collection Shortcuts */}
              <div className="dk-nav-item">
                <a
                  href="#mens-batik"
                  className="dk-nav-button"
                  onClick={() => onCategorySelect && onCategorySelect({ name: "Men's Batik", slug: 'men-batik-shirts' })}
                >
                  <span>Men's Batik</span>
                </a>
              </div>
              <div className="dk-nav-item">
                <a
                  href="#womens-sarees"
                  className="dk-nav-button"
                  onClick={() => onCategorySelect && onCategorySelect({ name: "Women's Sarees", slug: 'women-silk-saris' })}
                >
                  <span>Women's Sarees</span>
                </a>
              </div>
              <div className="dk-nav-item">
                <a
                  href="#handlooms"
                  className="dk-nav-button"
                  onClick={() => onCategorySelect && onCategorySelect({ name: "Pure Handlooms", slug: 'handlooms' })}
                >
                  <span>Pure Handlooms</span>
                </a>
              </div>
              <div className="dk-nav-item">
                <a
                  href="#linen"
                  className="dk-nav-button"
                  onClick={() => onCategorySelect && onCategorySelect({ name: "Linen Collection", slug: 'linen-collection' })}
                >
                  <span>Linen Collection</span>
                </a>
              </div>
            </nav>
          </div>
        </div>

        {/* Desktop Mega-Menu Overlay */}
        {activeMegaCategory && (
          <div onMouseEnter={handleMegaMenuMouseEnter}>
            <MegaMenu
              category={activeMegaCategory}
              onClose={() => setActiveMegaCategory(null)}
              onSelectCategory={onCategorySelect}
            />
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileDrawerOpen && (
        <div
          className="dk-mobile-drawer-backdrop"
          onClick={() => setIsMobileDrawerOpen(false)}
          data-testid="mobile-drawer-backdrop"
        >
          <div
            className="dk-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            data-testid="mobile-drawer"
          >
            <div className="dk-drawer-header">
              <div className="dk-brand-identity" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                <span className="dk-brand-main" style={{ fontSize: '1.25rem', color: '#000000' }}>
                  STACKSTORM
                </span>
                <span className="dk-brand-sub" style={{ fontSize: '0.62rem', color: '#000000' }}>
                  Dickwella Fashion Corner
                </span>
              </div>
              <button
                type="button"
                className="dk-action-btn"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Close mobile menu"
                data-testid="mobile-drawer-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="dk-drawer-body">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} role="search">
                <input
                  type="search"
                  className="dk-search-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* Mobile Category Accordion */}
              <div style={{ marginTop: '0.5rem' }}>
                {categories.map((category) => {
                  const hasChildren = category.children && category.children.length > 0;
                  const isExpanded = expandedMobileCat === category.id;

                  return (
                    <div key={category.id || category.slug} className="dk-drawer-cat-item">
                      <button
                        type="button"
                        className="dk-drawer-cat-btn"
                        onClick={() => toggleMobileCategory(category.id)}
                        data-testid={`mobile-cat-btn-${category.slug}`}
                      >
                        <span>{category.name}</span>
                        {hasChildren && (
                          <ChevronDown
                            size={16}
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        )}
                      </button>

                      {hasChildren && isExpanded && (
                        <ul className="dk-drawer-sublist" data-testid={`mobile-sublist-${category.slug}`}>
                          {category.children.map((subCat) => (
                            <li key={subCat.id || subCat.slug}>
                              <a
                                href={`#catalog/${category.slug}/${subCat.slug}`}
                                className="dk-drawer-sublink"
                                onClick={() => {
                                  setIsMobileDrawerOpen(false);
                                  if (onCategorySelect) onCategorySelect(category, subCat);
                                }}
                              >
                                {subCat.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
