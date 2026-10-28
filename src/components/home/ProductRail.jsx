import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../catalog/ProductCard';
import { LoadingState, ErrorState } from '../ui/States';

/**
 * A titled row of product cards that scrolls sideways (#176). Hidden when the section has
 * nothing to show, so an empty "Popular" never appears on the home page.
 */
export function ProductRail({ id, title, intro, link, resource, products }) {
  const listRef = useRef(null);
  const scroll = (direction) => {
    const list = listRef.current;
    if (list?.scrollBy)
      list.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (!resource.loading && !resource.error && products.length === 0) return null;

  return (
    <section className="container rail" aria-labelledby={id}>
      <div className="rail__head">
        <div>
          <h2 id={id}>{title}</h2>
          {intro && <p className="rail__intro">{intro}</p>}
        </div>
        <div className="rail__tools">
          {link && <Link to={link.to}>{link.label}</Link>}
          {products.length > 4 && (
            <>
              <button
                type="button"
                className="rail__arrow"
                aria-label={`Scroll ${title} back`}
                onClick={() => scroll(-1)}
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="rail__arrow"
                aria-label={`Scroll ${title} forward`}
                onClick={() => scroll(1)}
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
      {resource.loading && <LoadingState label={`Loading ${title.toLowerCase()}`} />}
      {resource.error && <ErrorState error={resource.error} onRetry={resource.reload} />}
      {products.length > 0 && (
        <ul className="rail__list" ref={listRef}>
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
