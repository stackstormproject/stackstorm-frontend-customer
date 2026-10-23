import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Heart,
  Search,
  User,
  MapPin,
  Truck,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronRight,
  Clock,
  ArrowRight,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import './styles/storefront.css'

export default function App() {
  const [wishlistCount] = useState(2)
  const [cartCount] = useState(1)
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    healthy: false,
    message: 'Testing API gateway...',
  })

  // Probe backend health endpoint via Vite proxy (/api/v1/health)
  useEffect(() => {
    let isMounted = true
    fetch('/api/v1/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            healthy: data.success === true,
            message: 'Connected to StackStorm Backend (Port 5000)',
          })
        }
      })
      .catch((err) => {
        if (isMounted) {
          setBackendStatus({
            checked: true,
            healthy: false,
            message: `Gateway Standby: ${err.message}`,
          })
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="storefront-app">
      {/* 1. Top Announcement Bar */}
      <div className="top-announcement-bar">
        <div className="container announcement-content">
          <div className="announcement-location">
            <MapPin size={14} color="#D4AF37" />
            <span>Main Street, Dickwella, Matara • Mon–Sun 9:00 AM – 8:00 PM</span>
          </div>
          <div>
            <span>Islandwide Courier Delivery Across Sri Lanka • Free Shipping on Orders Over LKR 10,000</span>
          </div>
          <div className="announcement-location">
            <Clock size={14} color="#10B981" />
            <span>Dispatch: Next Business Day</span>
          </div>
        </div>
      </div>

      {/* 2. Storefront Main Header */}
      <header className="storefront-header">
        <div className="container header-inner">
          {/* Brand Identity */}
          <div className="brand-identity">
            <a href="/" className="brand-title">
              Dickwella Fashion Corner
            </a>
            <span className="brand-subtitle">Authentic Sri Lankan Apparel</span>
          </div>

          {/* Navigation Links */}
          <nav className="header-nav" aria-label="Main Navigation">
            <a href="#mens-batik" className="nav-link active">Men's Batik</a>
            <a href="#womens-sarees" className="nav-link">Women's Sarees</a>
            <a href="#handlooms" className="nav-link">Pure Handlooms</a>
            <a href="#linen" className="nav-link">Linen Collection</a>
            <a href="#offers" className="nav-link">New Arrivals</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="header-actions">
            <button className="action-btn" aria-label="Search Catalog" title="Search Catalog">
              <Search size={18} />
            </button>
            <button className="action-btn" aria-label="View Wishlist" title="View Wishlist">
              <Heart size={18} />
              {wishlistCount > 0 && <span className="badge-count">{wishlistCount}</span>}
            </button>
            <button className="action-btn" aria-label="View Shopping Cart" title="View Shopping Cart">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
            </button>
            <button className="login-btn" aria-label="Customer Account">
              <User size={16} />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

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
              Authentic Sri Lankan <span className="gold-gradient-text">Handlooms & Batik</span>
            </h1>
            <p className="hero-description">
              Handcrafted in Dickwella with organic linen and heritage artisan wax-resist dyes.
              Engineered for tropical breathability, everyday comfort, and timeless island elegance.
            </p>
            <div className="hero-actions">
              <a href="#collections" className="btn-primary">
                <span>Explore Catalog</span>
                <ArrowRight size={18} />
              </a>
              <a href="#brand-story" className="btn-secondary">
                <Sparkles size={18} color="#D4AF37" />
                <span>Our Heritage Story</span>
              </a>
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
              <h4 className="prop-title">Islandwide Delivery</h4>
              <p className="prop-desc">Express delivery across all 25 districts. Free over LKR 10,000.</p>
            </div>
          </div>

          <div className="prop-card">
            <div className="prop-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <h4 className="prop-title">100% Artisan Craft</h4>
              <p className="prop-desc">Woven by traditional handloom masters in Dickwella, Matara.</p>
            </div>
          </div>

          <div className="prop-card">
            <div className="prop-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="prop-title">30-Day Return Policy</h4>
              <p className="prop-desc">Hassle-free returns or exchanges within 30 days of delivery.</p>
            </div>
          </div>

          <div className="prop-card">
            <div className="prop-icon">
              <Award size={22} />
            </div>
            <div>
              <h4 className="prop-title">Loyalty Rewards</h4>
              <p className="prop-desc">Earn 1–2 points per LKR 100 spent. Silver, Gold & Platinum perks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Collections Preview Grid */}
      <section className="collections-section" id="collections">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Signature Collections</h2>
              <p className="section-subtitle">
                Explore our curated range of authentic Sri Lankan apparel tailored for any occasion.
              </p>
            </div>
            <a href="#catalog" className="explore-pill">
              <span>View All Apparel</span>
              <ChevronRight size={16} />
            </a>
          </div>

          <div className="collections-grid">
            {/* Card 1 */}
            <div className="collection-card">
              <div className="collection-image-wrapper">
                <span className="collection-badge">Handcrafted</span>
                <img
                  src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"
                  alt="Men's Batik Shirt"
                  className="collection-img"
                  loading="lazy"
                />
              </div>
              <div className="collection-body">
                <span className="collection-category">Men's Apparel</span>
                <h3 className="collection-title">Signature Linen Batik Shirt</h3>
                <p className="prop-desc">Hand-waxed tropical motif on breathable Southern linen.</p>
                <div className="collection-price">
                  <span>LKR 4,500.00</span>
                  <span className="explore-pill">Explore <ChevronRight size={14} /></span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="collection-card">
              <div className="collection-image-wrapper">
                <span className="collection-badge">Heritage</span>
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
                  alt="Pure Handloom Saree"
                  className="collection-img"
                  loading="lazy"
                />
              </div>
              <div className="collection-body">
                <span className="collection-category">Women's Traditional</span>
                <h3 className="collection-title">Pure Handloom Cotton Saree</h3>
                <p className="prop-desc">Woven on pit looms with natural vegetable dyes and gold borders.</p>
                <div className="collection-price">
                  <span>LKR 12,500.00</span>
                  <span className="explore-pill">Explore <ChevronRight size={14} /></span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="collection-card">
              <div className="collection-image-wrapper">
                <span className="collection-badge">Casual Luxury</span>
                <img
                  src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"
                  alt="Casual Linen Trousers"
                  className="collection-img"
                  loading="lazy"
                />
              </div>
              <div className="collection-body">
                <span className="collection-category">Casual Wear</span>
                <h3 className="collection-title">Tailored Linen Trousers</h3>
                <p className="prop-desc">Comfort fit with elasticated drawstring waist and deep pockets.</p>
                <div className="collection-price">
                  <span>LKR 5,200.00</span>
                  <span className="explore-pill">Explore <ChevronRight size={14} /></span>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="collection-card">
              <div className="collection-image-wrapper">
                <span className="collection-badge">Traditional</span>
                <img
                  src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80"
                  alt="Southern Handloom Sarong"
                  className="collection-img"
                  loading="lazy"
                />
              </div>
              <div className="collection-body">
                <span className="collection-category">Men's Traditional</span>
                <h3 className="collection-title">Southern Handloom Sarong</h3>
                <p className="prop-desc">High-count combed cotton weave with traditional striped borders.</p>
                <div className="collection-price">
                  <span>LKR 3,800.00</span>
                  <span className="explore-pill">Explore <ChevronRight size={14} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. System Architecture & Token Telemetry Box */}
      <section className="container">
        <div className="telemetry-card">
          <div className="telemetry-header">
            <div className="telemetry-title">
              <Layers size={18} color="#D4AF37" />
              <span>StackStorm Design Tokens & API Gateway Status</span>
            </div>
            <span className="telemetry-badge">
              <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
              STORM-FE-001 Verified
            </span>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-item">
              <div className="telemetry-label">Primary Brand Color</div>
              <div className="telemetry-val" style={{ color: '#0A192F' }}>
                #0A192F (Navy)
              </div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-label">Accent Gold</div>
              <div className="telemetry-val" style={{ color: '#D4AF37' }}>
                #D4AF37 (Gold)
              </div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-label">Typography Heading / Body</div>
              <div className="telemetry-val">Outfit / Inter</div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-label">Backend REST Gateway</div>
              <div className="telemetry-val" style={{ color: backendStatus.healthy ? '#10B981' : '#F59E0B' }}>
                {backendStatus.message}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Storefront Footer */}
      <footer className="storefront-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h4 className="footer-col-title">Dickwella Fashion Corner</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-inverse-muted)' }}>
                Purveyors of fine Sri Lankan handloom textiles, bespoke batik shirts, and tropical linen wear.
                Rooted in the coastal heritage of Dickwella, Matara.
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>
                Main Street, Dickwella, Southern Province, Sri Lanka (Postal Code: 81100)
              </p>
            </div>

            <div>
              <h4 className="footer-col-title">Customer Care</h4>
              <ul className="footer-links">
                <li><a href="#tracking" className="footer-link">Track Delivery Order</a></li>
                <li><a href="#returns" className="footer-link">30-Day Return & Exchange Policy</a></li>
                <li><a href="#shipping" className="footer-link">Islandwide Courier Rates</a></li>
                <li><a href="#loyalty" className="footer-link">Loyalty Tier Benefits</a></li>
                <li><a href="#support" className="footer-link">Live Support Chat</a></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Apparel Categories</h4>
              <ul className="footer-links">
                <li><a href="#mens-batik" className="footer-link">Men's Batik Shirts</a></li>
                <li><a href="#womens-sarees" className="footer-link">Handloom Sarees</a></li>
                <li><a href="#sarongs" className="footer-link">Traditional Sarongs</a></li>
                <li><a href="#linen-collection" className="footer-link">Pure Linen Kurtas</a></li>
                <li><a href="#kids" className="footer-link">Kids Batik Wear</a></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Academic Attribution</h4>
              <p style={{ fontSize: 'var(--text-xs)' }}>
                Department of Software Engineering<br />
                Faculty of Science, University of Kelaniya<br />
                Course Module: SENG 31242 (2026)
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>
                Engineered with React 18, Vite 5 & Vanilla CSS Tokens.
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Dickwella Fashion Corner. All Rights Reserved.</span>
            <span className="credits-badge">
              Software Engineering Team: Amarawickrama R.H. • S. Thanoogithan • B.K. Pabasara • Lakshani A.T.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
