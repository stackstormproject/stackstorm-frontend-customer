import { Link } from 'react-router-dom';
import { listProducts } from '../api/catalog';
import { useResource } from '../hooks/useResource';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { LoadingState, ErrorState } from '../components/ui/States';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { PromoBanners } from '../components/home/PromoBanners';

const FEATURED_COUNT = 4;

export default function HomePage() {
  const featured = useResource(() => listProducts({ sort: 'newest' }), []);
  const products = featured.data?.products?.slice(0, FEATURED_COUNT) || [];

  return (
    <>
      <HeroCarousel />
      <PromoBanners />

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
