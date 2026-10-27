import React from 'react';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import './MegaMenu.css';

export const MegaMenu = ({ category, onClose, onSelectCategory }) => {
  if (!category) return null;

  const children = category.children || [];
  const featuredImage =
    category.featuredImage ||
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80';
  const tagline = category.tagline || 'Artisan Sri Lankan Heritage Collection';

  const handleSubcategoryClick = (subCat, e) => {
    e.preventDefault();
    if (onSelectCategory) {
      onSelectCategory(category, subCat);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="mega-menu-wrapper"
      role="menu"
      aria-label={`${category.name} subcategories`}
      data-testid="mega-menu"
      onMouseLeave={onClose}
    >
      <div className="container mega-menu-grid">
        {/* Subcategories Column */}
        <div className="mega-menu-content">
          <div className="mega-menu-header">
            <h3 className="mega-menu-cat-title">{category.name} Collection</h3>
            <p className="mega-menu-cat-desc">{category.description}</p>
          </div>

          <ul className="mega-menu-subcategories">
            {children.length > 0 ? (
              children.map((subCat) => (
                <li key={subCat.id || subCat.slug}>
                  <a
                    href={`#catalog/${category.slug}/${subCat.slug}`}
                    className="mega-menu-item"
                    onClick={(e) => handleSubcategoryClick(subCat, e)}
                    data-testid={`submenu-item-${subCat.slug}`}
                  >
                    <div className="mega-menu-item-header">
                      <span className="mega-menu-item-name">{subCat.name}</span>
                      <ChevronRight size={14} color="#D4AF37" />
                    </div>
                    {subCat.description && (
                      <p className="mega-menu-item-desc">{subCat.description}</p>
                    )}
                  </a>
                </li>
              ))
            ) : (
              <li
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-sm)',
                  padding: 'var(--space-2)',
                }}
              >
                Explore all {category.name} handcrafted apparel online.
              </li>
            )}
          </ul>

          <div className="mega-menu-quick-links">
            <a
              href={`#catalog/${category.slug}`}
              className="mega-menu-link"
              onClick={(e) => handleSubcategoryClick(null, e)}
            >
              <span>
                View All {category.name} ({children.length} Categories)
              </span>
              <ArrowRight size={12} />
            </a>
            <a href="#new-arrivals" className="mega-menu-link">
              <Sparkles size={12} color="#D4AF37" />
              <span>New Arrivals</span>
            </a>
            <a href="#size-guide" className="mega-menu-link">
              <span>Bespoke Size Guide</span>
            </a>
          </div>
        </div>

        {/* Featured Showcase Card */}
        <div className="mega-menu-featured">
          <img
            src={featuredImage}
            alt={`${category.name} featured collection`}
            className="mega-menu-featured-img"
            loading="lazy"
          />
          <div className="mega-menu-featured-overlay" />
          <div className="mega-menu-featured-content">
            <span className="mega-menu-featured-badge">Dickwella Atelier</span>
            <h4 className="mega-menu-featured-title">{tagline}</h4>
            <span className="mega-menu-featured-cta">
              <span>Explore Lookbook</span>
              <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
