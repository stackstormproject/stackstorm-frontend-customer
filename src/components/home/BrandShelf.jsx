import { Link } from 'react-router-dom';

/** "Our brands": featured brands with products on sale, each linking to its products (#176). */
export function BrandShelf({ brands }) {
  if (!brands.length) return null;
  return (
    <section className="brand-shelf" aria-labelledby="our-brands">
      <div className="container">
        <h2 id="our-brands">Our brands</h2>
        <ul className="brand-shelf__list">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link to={`/shop?brand=${encodeURIComponent(brand.slug)}`} className="brand-tile">
                {brand.logo_url && <img src={brand.logo_url} alt="" className="brand-tile__logo" />}
                <span className={brand.logo_url ? 'brand-tile__name' : 'brand-tile__wordmark'}>
                  {brand.name}
                </span>
                {brand.tagline && <span className="brand-tile__tagline">{brand.tagline}</span>}
                <span className="brand-tile__count">
                  {brand.product_count} {brand.product_count === 1 ? 'product' : 'products'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
