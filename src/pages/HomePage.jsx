import { Link } from 'react-router-dom';
import { listProducts } from '../api/catalog';
import { useResource } from '../hooks/useResource';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { LoadingState, ErrorState } from '../components/ui/States';

const FEATURED_COUNT = 4;

export default function HomePage() {
  const featured = useResource(() => listProducts({ sort: 'newest' }), []);
  const products = featured.data?.products?.slice(0, FEATURED_COUNT) || [];

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <h1 className="hero__title">Handloom and batik from Dickwella</h1>
          <p className="hero__lede">
            Shirts, sarees and sarongs woven and dyed on the south coast. Delivered islandwide, free
            over LKR 10,000.
          </p>
          <div className="hero__actions">
            <Link to="/shop" className="btn btn--primary">
              Shop the collection
            </Link>
            <Link to="/help/delivery" className="btn btn--ghost">
              Delivery details
            </Link>
          </div>
        </div>
        <div className="warp-stripe warp-stripe--wide" aria-hidden="true" />
      </section>

      <section className="container page" aria-labelledby="new-in">
        <div className="section-head">
          <h2 id="new-in">New in</h2>
          <Link to="/shop">See everything</Link>
        </div>
        {featured.loading && <LoadingState label="Loading new arrivals" />}
        {featured.error && <ErrorState error={featured.error} onRetry={featured.reload} />}
        {products.length > 0 && <ProductGrid products={products} />}
      </section>
    </>
  );
}
