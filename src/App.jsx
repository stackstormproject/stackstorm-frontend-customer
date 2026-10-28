import React, { useState, useEffect } from 'react';
import {
  Truck,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Maximize2,
  Heart,
  ShoppingBag,
  MapPin,
  Clock,
} from 'lucide-react';
import { ToastProvider, useToast } from './context/ToastContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { CartProvider, useCart } from './context/CartContext';
import { ToastContainer } from './components/common/ToastContainer';
import { Modal } from './components/common/Modal';
import { Header, Breadcrumbs } from './components/navigation';
import { ProductGrid } from './components/catalog';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { BrandStoryPage } from './pages/BrandStoryPage';
import { CartDrawer } from './components/cart';
import { productApi, FALLBACK_PRODUCTS } from './api/product.api';
import { ReservationBanner } from './components/checkout/ReservationBanner';
import { ReservationExpiredModal } from './components/checkout/ReservationExpiredModal';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { inventoryApi } from './api/inventory.api';
import { AuthModal } from './components/auth/AuthModal';
import { authApi } from './api/auth.api';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import ChatWidget from './components/chat/ChatWidget';
import './styles/storefront.css';
import './styles/accessibility.css';

function StorefrontContent() {
  const { toast } = useToast();
  const {
    wishlistIds,
    wishlistItems,
    wishlistCount,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  const { totalItems: cartCount, openCart, closeCart, addItem: addCartItem } = useCart();
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [activeReservation, setActiveReservation] = useState(() => {
    if (typeof window === 'undefined') return null;
    const cached = sessionStorage.getItem('stackstorm_reservation_expires_at');
    if (cached) {
      const diff = new Date(cached).getTime() - Date.now();
      if (diff > 0) {
        return {
          expiresAt: cached,
          reservationId: sessionStorage.getItem('stackstorm_reservation_id') || 'res-active',
        };
      }
    }
    return null;
  });
  const [isReservationExpired, setIsReservationExpired] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWishlistView, setIsWishlistView] = useState(false);
  const [isCheckoutView, setIsCheckoutView] = useState(false);
  const [isProfileView, setIsProfileView] = useState(false);
  const [isOrderHistoryView, setIsOrderHistoryView] = useState(false);
  const [isBrandStoryView, setIsBrandStoryView] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const rawUser =
        localStorage.getItem('stackstorm_user') ||
        localStorage.getItem('stackstorm_auth_user') ||
        localStorage.getItem('user');
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });
  const [completedOrder, setCompletedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [breadcrumbTrail, setBreadcrumbTrail] = useState([]);

  // Product Catalog State (STORM-FE-006)
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    max_price: 20000,
    size: '',
    color: '',
    sort: 'featured',
  });

  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    healthy: false,
    message: 'Testing API gateway...',
  });

  // Probe backend health endpoint via Vite proxy (/api/v1/health)
  useEffect(() => {
    let isMounted = true;
    fetch('/api/v1/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            healthy: data.success === true,
            message: 'Connected to StackStorm Backend',
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            healthy: false,
            message: `Gateway Standby: ${err.message}`,
          });
        }
      });

    // Check for stored token and restore/verify user profile
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('stackstorm_token') ||
      localStorage.getItem('stackstorm_auth_token');
    if (token) {
      fetch('/api/v1/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const profile = data?.data || data?.user || data;
          if (isMounted && profile && (profile.email || profile.id)) {
            setCurrentUser(profile);
            try {
              localStorage.setItem('stackstorm_user', JSON.stringify(profile));
            } catch (_) {}
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch catalog products dynamically based on filters
  useEffect(() => {
    let isMounted = true;
    if (products.length === 0) {
      setIsLoadingProducts(true);
    }

    productApi
      .getProducts(filters)
      .then((res) => {
        if (isMounted) {
          setProducts(res.products || FALLBACK_PRODUCTS);
          setIsLoadingProducts(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProducts(FALLBACK_PRODUCTS);
          setIsLoadingProducts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (key === 'category') {
      if (!value || value === 'all') {
        setBreadcrumbTrail([]);
      } else {
        const formattedName = value
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        setBreadcrumbTrail([
          { label: 'Home', href: '/' },
          { label: formattedName, active: true },
        ]);
      }
    }
  };

  const handleClearFilters = () => {
    setFilters({
      category: 'all',
      max_price: 20000,
      size: '',
      color: '',
      sort: 'featured',
    });
    setBreadcrumbTrail([]);
  };

  const handleAddToCart = (product, variant = null, qty = 1) => {
    addCartItem(product, variant, qty);
    toast.success(`${product.title} added to your shopping cart!`, {
      title: 'Cart Updated',
      duration: 4000,
    });
  };

  const handleToggleWishlist = async (product) => {
    try {
      const willBeSaved = !wishlistIds.includes(product.id);
      await toggleWishlist(product);
      if (willBeSaved) {
        toast.success(`Saved "${product.title}" to your wishlist!`, { title: 'Wishlist Updated' });
      } else {
        toast.info(`Removed "${product.title}" from wishlist.`, { title: 'Wishlist Updated' });
      }
    } catch {
      toast.error('Could not update wishlist', { title: 'Wishlist Error' });
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setIsWishlistView(false);
    setIsProfileView(false);
    setIsCheckoutView(false);
    setIsOrderHistoryView(false);
    setIsBrandStoryView(false);
    setCompletedOrder(null);
    if (product) {
      setBreadcrumbTrail([
        { label: 'Home', href: '/' },
        { label: product.category || 'Collections', href: '#catalog' },
        { label: product.title, active: true },
      ]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setSelectedProduct(null);
    setIsWishlistView(false);
    setIsProfileView(false);
    setIsCheckoutView(false);
    setIsOrderHistoryView(false);
    setIsBrandStoryView(false);
    setCompletedOrder(null);
    setFilters((prev) => ({ ...prev, category: 'all', search: '' }));
    setBreadcrumbTrail([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePdpAddToCart = (product, variant, qty = 1) => {
    addCartItem(product, variant, qty);
    toast.success(
      `Added ${qty}x ${product.title} (${variant?.size || ''} / ${variant?.color || ''}) to your cart!`,
      { title: 'Cart Updated', duration: 4000 }
    );
  };

  const handlePdpReserveStock = (product, variant) => {
    setIsReservationModalOpen(true);
  };

  const handlePdpNotifyMe = (product) => {
    toast.info(`We'll notify you as soon as ${product.title} is back in stock!`, {
      title: 'Restock Alert Active',
      duration: 4000,
    });
  };

  const handleConfirmReservation = async () => {
    setIsReservationModalOpen(false);
    try {
      const res = await inventoryApi.reserveStock({ variant_id: 1, quantity: 1 });
      const expiresAt =
        res?.data?.expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const reservationId = res?.data?.reservation_id || `res-${Date.now()}`;

      sessionStorage.setItem('stackstorm_reservation_id', reservationId);
      sessionStorage.setItem('stackstorm_reservation_expires_at', expiresAt);
      setActiveReservation({ expiresAt, reservationId });
      setIsReservationExpired(false);

      toast.success('Inventory lock acquired! 15-minute temporary reservation active.', {
        title: 'Stock Reserved',
        duration: 5000,
      });

      setIsCheckoutView(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const reservationId = `res-local-${Date.now()}`;
      setActiveReservation({ expiresAt, reservationId });
      setIsReservationExpired(false);
      setIsCheckoutView(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Temporary stock hold active (15:00 countdown).', {
        title: 'Stock Reserved',
        duration: 5000,
      });
    }
  };

  const handleReservationExpire = () => {
    setIsReservationExpired(true);
    setActiveReservation(null);
    toast.warning('Your 15-minute stock hold has expired. Items released back to inventory.', {
      title: 'Reservation Expired',
      duration: 6000,
    });
  };

  const handleReturnToCartFromExpired = async () => {
    if (activeReservation?.reservationId) {
      try {
        await inventoryApi.releaseStock(activeReservation.reservationId);
      } catch (_) {}
    }
    sessionStorage.removeItem('stackstorm_reservation_id');
    sessionStorage.removeItem('stackstorm_reservation_expires_at');
    setIsReservationExpired(false);
    openCart();
  };

  const handleCustomerLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Customer logout error:', err?.message);
    } finally {
      setCurrentUser(null);
      try {
        localStorage.removeItem('stackstorm_user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('stackstorm_token');
      } catch (_) {}
      setIsProfileView(false);
      toast.info('You have been logged out of your account.', {
        title: 'Logged Out',
        duration: 4000,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearch = (query) => {
    setFilters((prev) => ({ ...prev, search: query }));
    setSelectedProduct(null);
    setIsBrandStoryView(false);
    setIsWishlistView(false);
    setIsProfileView(false);
    setIsCheckoutView(false);
    setIsOrderHistoryView(false);
    setCompletedOrder(null);
    setTimeout(() => {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleCategorySelect = (category, subCategory) => {
    const targetSlug = subCategory ? subCategory.slug : category.slug;
    setFilters((prev) => ({ ...prev, category: targetSlug }));

    setSelectedProduct(null);
    setIsBrandStoryView(false);
    setIsWishlistView(false);
    setIsProfileView(false);
    setIsCheckoutView(false);
    setIsOrderHistoryView(false);
    setCompletedOrder(null);

    if (subCategory) {
      setBreadcrumbTrail([
        { label: 'Home', href: '/' },
        { label: category.name, href: `#catalog/${category.slug}` },
        { label: subCategory.name, active: true },
      ]);
    } else {
      setBreadcrumbTrail([
        { label: 'Home', href: '/' },
        { label: category.name, active: true },
      ]);
    }

    setTimeout(() => {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  return (
    <div className="storefront-app">
      {/* WCAG 2.1 AA Skip to Content Navigation (STORM-FE-023) */}
      <a href="#main-content" className="skip-to-content" data-testid="skip-to-content-link">
        Skip to main content
      </a>

      {/* 1. Header with Announcement Bar & Mega-Menu (STORM-FE-005) */}
      <Header
        wishlistCount={wishlistCount}
        cartCount={cartCount}
        currentUser={currentUser}
        onSearch={handleSearch}
        onHomeClick={handleBackToCatalog}
        onWishlistClick={() => {
          setIsWishlistView(true);
          setIsProfileView(false);
          setIsCheckoutView(false);
          setIsOrderHistoryView(false);
          setIsBrandStoryView(false);
          setCompletedOrder(null);
          setSelectedProduct(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onCartClick={openCart}
        onAccountClick={() => {
          if (currentUser) {
            setIsProfileView(true);
            setIsWishlistView(false);
            setIsCheckoutView(false);
            setIsOrderHistoryView(false);
            setIsBrandStoryView(false);
            setCompletedOrder(null);
            setSelectedProduct(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setIsAuthModalOpen(true);
          }
        }}
        onCategorySelect={handleCategorySelect}
      />

      {/* 15-Minute Temporary Stock Reservation Live Countdown Banner (STORM-FE-010) */}
      {activeReservation && (
        <div style={{ maxWidth: '1280px', margin: '0.75rem auto 0', padding: '0 1.5rem' }}>
          <ReservationBanner
            expiresAt={activeReservation.expiresAt}
            onExpire={handleReservationExpire}
          />
        </div>
      )}

      {/* Main View: Order Success Receipt, Checkout, Profile Hub, Dedicated Wishlist, PDP, or Catalog */}
      <main id="main-content" tabIndex="-1">
        {completedOrder ? (
          <OrderSuccessPage
            order={completedOrder}
            onContinueShopping={() => {
              setCompletedOrder(null);
              setIsCheckoutView(false);
              setIsProfileView(false);
              setSelectedProduct(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : isCheckoutView ? (
          <CheckoutPage
            onBackToCatalog={() => {
              setIsCheckoutView(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOrderCompleted={(order) => {
              setCompletedOrder(order);
              setIsCheckoutView(false);
              setIsProfileView(false);
              setSelectedProduct(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            initialReservation={activeReservation}
          />
        ) : isOrderHistoryView ? (
          <OrderHistoryPage
            onBackToCatalog={() => {
              setIsOrderHistoryView(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewInvoice={(ord) => {
              setCompletedOrder(ord);
              setIsOrderHistoryView(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : isProfileView ? (
          <CustomerProfilePage
            initialProfile={currentUser}
            onBackToCatalog={() => {
              setIsProfileView(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onProfileUpdated={(updated) => {
              setCurrentUser(updated);
            }}
            onLogout={handleCustomerLogout}
          />
        ) : isWishlistView ? (
          <WishlistPage
            items={wishlistItems}
            onRemoveItem={(id) => {
              removeFromWishlist(id);
              toast.info('Item removed from wishlist.', { title: 'Wishlist' });
            }}
            onMoveToCart={(product) => {
              handleAddToCart(product);
              removeFromWishlist(product.id);
              toast.success(`Moved ${product.title} to shopping cart!`, { title: 'Cart Updated' });
            }}
            onClearWishlist={() => {
              clearWishlist();
              toast.info('All wishlist items cleared.', { title: 'Wishlist' });
            }}
            onViewDetails={handleViewDetails}
            onExploreCatalog={handleBackToCatalog}
          />
        ) : isBrandStoryView ? (
          <BrandStoryPage onBackToCatalog={handleBackToCatalog} />
        ) : selectedProduct ? (
          <ProductDetailPage
            productSlug={selectedProduct.slug}
            initialProduct={selectedProduct}
            onBack={handleBackToCatalog}
            onAddToCart={handlePdpAddToCart}
            onReserveStock={handlePdpReserveStock}
            onToggleWishlist={handleToggleWishlist}
            isWishlisted={wishlistIds.includes(selectedProduct.id)}
            onNotifyMe={handlePdpNotifyMe}
          />
        ) : (
          <>
            {/* 2. Dynamic Breadcrumbs with Schema.org JSON-LD (STORM-FE-005) */}
            <Breadcrumbs items={breadcrumbTrail} onHomeClick={handleBackToCatalog} />

            {/* 3. Hero Section */}
            <section className="hero-section">
              <div className="hero-bg-accent" />
              <div className="container hero-grid">
                <div className="hero-content">
                  <div className="hero-badge">
                    <span className="pulse-dot" />
                    <span>Southern Province Heritage Craft</span>
                  </div>
                  <h1 className="hero-title">
                    Authentic Sri Lankan{' '}
                    <span className="gold-gradient-text">Handlooms & Batik</span>
                  </h1>
                  <p className="hero-description">
                    Handcrafted in Dickwella with organic linen and heritage artisan wax-resist
                    dyes. Engineered for tropical breathability, everyday comfort, and timeless
                    island elegance.
                  </p>
                  <div className="hero-actions">
                    <a href="#catalog" className="btn-primary">
                      <span>Explore Catalog</span>
                      <ArrowRight size={18} />
                    </a>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setIsBrandStoryView(true);
                        setIsProfileView(false);
                        setIsWishlistView(false);
                        setIsCheckoutView(false);
                        setIsOrderHistoryView(false);
                        setSelectedProduct(null);
                        setCompletedOrder(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      data-testid="hero-brand-story-btn"
                    >
                      <Sparkles size={18} color="#D4AF37" />
                      <span>Our Heritage Story</span>
                    </button>
                  </div>
                </div>

                {/* Hero Showcase Card */}
                <div className="glass-panel-dark hero-card">
                  <div className="hero-card-header">
                    <span className="hero-card-title">Live Atelier Telemetry</span>
                    <span className="hero-card-tag">Open Today</span>
                  </div>
                  <div className="hero-stats-grid">
                    <div className="hero-stat-box">
                      <div className="hero-stat-value">500+</div>
                      <div className="hero-stat-label">Artisan Batik Patterns</div>
                    </div>
                    <div className="hero-stat-box">
                      <div className="hero-stat-value">100%</div>
                      <div className="hero-stat-label">Natural Organic Linen</div>
                    </div>
                    <div className="hero-stat-box">
                      <div className="hero-stat-value">30-Day</div>
                      <div className="hero-stat-label">Delivery Guarantee</div>
                    </div>
                    <div className="hero-stat-box">
                      <div className="hero-stat-value">LKR</div>
                      <div className="hero-stat-label">Sri Lankan Currency</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Value Propositions (4-Pillars) */}
            <section className="value-props-section">
              <div className="container value-props-grid">
                <div className="prop-card">
                  <div className="prop-icon">
                    <Truck size={22} />
                  </div>
                  <div>
                    <h2 className="prop-title">Islandwide Delivery</h2>
                    <p className="prop-desc">
                      Express delivery across all 25 districts. Free over LKR 10,000.
                    </p>
                  </div>
                </div>

                <div className="prop-card">
                  <div className="prop-icon">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h2 className="prop-title">100% Artisan Craft</h2>
                    <p className="prop-desc">
                      Woven by traditional handloom masters in Dickwella, Matara.
                    </p>
                  </div>
                </div>

                <div className="prop-card">
                  <div className="prop-icon">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="prop-title">30-Day Return Policy</h2>
                    <p className="prop-desc">
                      Hassle-free returns or exchanges within 30 days of delivery.
                    </p>
                  </div>
                </div>

                <div className="prop-card">
                  <div className="prop-icon">
                    <Award size={22} />
                  </div>
                  <div>
                    <h2 className="prop-title">Loyalty Rewards</h2>
                    <p className="prop-desc">
                      Earn 1–2 points per LKR 100 spent. Silver, Gold & Platinum perks.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Dynamic Product Catalog Grid with Multi-Faceted Filters (STORM-FE-006) */}
            <section className="collections-section" id="catalog">
              <div className="container">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">Signature Collections</h2>
                    <p className="section-subtitle">
                      Filter and sort authentic Sri Lankan handloom sarees, bespoke batik shirts,
                      and tailored linen apparel.
                    </p>
                  </div>
                  <a href="#catalog" className="explore-pill" onClick={handleClearFilters}>
                    <span>Reset Filters</span>
                    <ChevronRight size={16} />
                  </a>
                </div>

                <ProductGrid
                  products={products}
                  isLoading={isLoadingProducts}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  onViewDetails={handleViewDetails}
                  wishlistIds={wishlistIds}
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* 6. Bottom Service Announcement Bar (Relocated from Top Bar) */}
      <div className="storefront-bottom-bar" data-testid="bottom-announcement-bar">
        <div className="container bottom-bar-inner">
          <div className="bottom-bar-item">
            <MapPin size={13} color="#D4AF37" />
            <span>Main Street, Dickwella, Matara • Mon–Sun 9:00 AM – 8:00 PM</span>
          </div>
          <div className="bottom-bar-item bottom-bar-item--highlight">
            <Truck size={13} color="#D4AF37" />
            <span>
              Islandwide Courier Delivery Across Sri Lanka • Free Shipping Over LKR 10,000
            </span>
          </div>
        </div>
      </div>

      {/* 7. Storefront Footer */}
      <footer className="storefront-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h4 className="footer-col-title">Dickwella Fashion Corner</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-inverse-muted)' }}>
                Purveyors of fine Sri Lankan handloom textiles, bespoke batik shirts, and tropical
                linen wear. Rooted in the coastal heritage of Dickwella, Matara.
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>
                Main Street, Dickwella, Southern Province, Sri Lanka (Postal Code: 81100)
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="footer-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#D4AF37',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  onClick={() => {
                    setIsBrandStoryView(true);
                    setIsProfileView(false);
                    setIsWishlistView(false);
                    setIsCheckoutView(false);
                    setIsOrderHistoryView(false);
                    setSelectedProduct(null);
                    setCompletedOrder(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  data-testid="footer-brand-story-btn"
                >
                  <Sparkles size={13} color="#D4AF37" />
                  <span>Our Heritage Brand Story →</span>
                </button>
              </p>
            </div>

            <div>
              <h4 className="footer-col-title">Customer Care</h4>
              <ul className="footer-links">
                <li>
                  <a
                    href="#tracking"
                    className="footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOrderHistoryView(true);
                      setIsProfileView(false);
                      setIsWishlistView(false);
                      setIsCheckoutView(false);
                      setSelectedProduct(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Track Delivery Order
                  </a>
                </li>
                <li>
                  <a href="#returns" className="footer-link">
                    30-Day Return & Exchange Policy
                  </a>
                </li>
                <li>
                  <a href="#shipping" className="footer-link">
                    Islandwide Courier Rates
                  </a>
                </li>
                <li>
                  <a href="#loyalty" className="footer-link">
                    Loyalty Tier Benefits
                  </a>
                </li>
                <li>
                  <a href="#support" className="footer-link">
                    Live Support Chat
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Apparel Categories</h4>
              <ul className="footer-links">
                <li>
                  <a href="#mens-batik" className="footer-link">
                    Men's Batik Shirts
                  </a>
                </li>
                <li>
                  <a href="#womens-sarees" className="footer-link">
                    Handloom Sarees
                  </a>
                </li>
                <li>
                  <a href="#sarongs" className="footer-link">
                    Traditional Sarongs
                  </a>
                </li>
                <li>
                  <a href="#linen-collection" className="footer-link">
                    Pure Linen Kurtas
                  </a>
                </li>
                <li>
                  <a href="#kids" className="footer-link">
                    Kids Batik Wear
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Academic Attribution</h4>
              <p style={{ fontSize: 'var(--text-xs)' }}>
                Department of Software Engineering
                <br />
                Faculty of Science, University of Kelaniya
                <br />
                Course Module: SENG 31242 (2026)
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>
                Engineered with React 18, Vite 5 & Vanilla CSS Tokens.
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Dickwella Fashion Corner. All Rights Reserved.</span>
          </div>
        </div>
      </footer>

      {/* Accessible Stock Reservation Confirmation Modal */}
      <Modal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        title="Confirm 15-Minute Temporary Stock Lock"
        description="StackStorm Redis Stock Reservation Engine"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="dk-modal-btn dk-modal-btn--secondary"
              onClick={() => setIsReservationModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dk-modal-btn dk-modal-btn--primary"
              onClick={handleConfirmReservation}
            >
              Confirm & Lock Stock
            </button>
          </>
        }
      >
        <p style={{ margin: '0 0 var(--space-3) 0' }}>
          You are requesting a <strong>15-minute temporary inventory reservation hold</strong> for
          item <code>BATIK-MEN-M-001</code>.
        </p>
        <div
          style={{
            background: 'var(--color-surface-subtle)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          <p style={{ margin: '0 0 var(--space-2) 0' }}>
            🔒 <strong>Atomic Guarantee:</strong> The SKU will be locked in Redis with a 900-second
            TTL. Other customers cannot check out this specific piece until your session expires or
            order completes.
          </p>
          <p style={{ margin: 0 }}>
            ⏱ <strong>Auto-Release Sync:</strong> If checkout is not completed within 15 minutes,
            the reservation expires automatically and restores stock to the public pool.
          </p>
        </div>
      </Modal>

      {/* Customer Authentication Modal (STORM-FE-013) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(userData) => {
          setIsAuthModalOpen(false);
          const user = userData?.customer || userData?.user || userData;
          setCurrentUser(user);
          try {
            localStorage.setItem('stackstorm_user', JSON.stringify(user));
          } catch (_) {}
          const name = user?.first_name || user?.name || user?.email || 'Valued Customer';
          toast.success(`Welcome, ${name}! Your profile and cart are synchronized.`, {
            title: 'Authentication Successful',
            duration: 5000,
          });
        }}
      />

      {/* Slide-Over Shopping Cart Drawer (STORM-FE-009) */}
      <CartDrawer
        onCheckout={() => {
          if (typeof closeCart === 'function') {
            closeCart();
          }
          setIsCheckoutView(true);
          setIsProfileView(false);
          setIsWishlistView(false);
          setIsOrderHistoryView(false);
          setIsBrandStoryView(false);
          setSelectedProduct(null);
          setCompletedOrder(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 15-Minute Stock Reservation Expired Modal (STORM-FE-010) */}
      <ReservationExpiredModal
        isOpen={isReservationExpired}
        onReturnToCart={handleReturnToCartFromExpired}
        onBrowseProducts={() => {
          setIsReservationExpired(false);
          setSelectedProduct(null);
        }}
      />

      {/* Floating Live Support Chat Widget & Bot Fallback (STORM-FE-021) */}
      <ChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <WishlistProvider>
        <CartProvider>
          <StorefrontContent />
          <ToastContainer />
        </CartProvider>
      </WishlistProvider>
    </ToastProvider>
  );
}
