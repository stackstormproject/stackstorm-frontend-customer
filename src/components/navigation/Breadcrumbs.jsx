import React, { useMemo } from 'react';
import { Home, ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

export const Breadcrumbs = ({ items = [], onHomeClick }) => {
  const normalizedItems = useMemo(() => {
    if (!items || items.length === 0) {
      return [];
    }
    // If first item isn't Home, prepend Home
    if (items[0]?.label?.toLowerCase() !== 'home') {
      return [{ label: 'Home', href: '/' }, ...items];
    }
    return items;
  }, [items]);

  // Generate Schema.org BreadcrumbList JSON-LD
  const schemaJsonLd = useMemo(() => {
    if (!normalizedItems || normalizedItems.length <= 1) return null;
    const itemListElement = normalizedItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href
        ? (item.href.startsWith('http') ? item.href : `https://dickwellafashion.lk${item.href}`)
        : undefined,
    }));

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    });
  }, [normalizedItems]);

  // Don't render breadcrumbs on root/home level
  if (!normalizedItems || normalizedItems.length <= 1) {
    return null;
  }

  return (
    <nav className="dk-breadcrumbs-nav" aria-label="Breadcrumb" data-testid="breadcrumbs-nav">
      <div className="container">
        <ol className="dk-breadcrumbs-list">
          {normalizedItems.map((item, index) => {
            const isLast = index === normalizedItems.length - 1;
            const isFirst = index === 0;

            return (
              <li key={`${item.label}-${index}`} className="dk-breadcrumbs-item">
                {isFirst && <Home size={12} style={{ marginRight: '2px', color: '#D4AF37' }} />}
                {isLast ? (
                  <span
                    className="dk-breadcrumbs-current"
                    aria-current="page"
                    data-testid="breadcrumb-current"
                  >
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href || '#'}
                    className="dk-breadcrumbs-link"
                    data-testid={`breadcrumb-link-${index}`}
                    onClick={(e) => {
                      if (item.onClick) {
                        e.preventDefault();
                        item.onClick(e);
                      } else if (isFirst || item.href === '/') {
                        if (onHomeClick) {
                          e.preventDefault();
                          onHomeClick();
                        }
                      }
                    }}
                  >
                    {item.label}
                  </a>
                )}
                {!isLast && (
                  <span className="dk-breadcrumbs-separator" aria-hidden="true">
                    <ChevronRight size={12} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Schema.org Microdata for Search Engine Optimization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJsonLd }}
        data-testid="breadcrumb-jsonld"
      />
    </nav>
  );
};

export default Breadcrumbs;
