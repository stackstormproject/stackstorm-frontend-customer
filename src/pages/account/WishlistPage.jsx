import { Link } from 'react-router-dom';
import { useWishlist } from '../../state/WishlistContext';
import { ProductGrid } from '../../components/catalog/ProductGrid';
import { EmptyState } from '../../components/ui/States';

export default function WishlistPage() {
  const { products } = useWishlist();
  if (!products.length) {
    return (
      <EmptyState
        title="Nothing saved yet"
        action={
          <Link to="/shop" className="btn btn--secondary">
            Browse the shop
          </Link>
        }
      >
        Tap the heart on any product to keep it here.
      </EmptyState>
    );
  }
  return (
    <section aria-labelledby="wishlist-heading">
      <h2 id="wishlist-heading">Wishlist</h2>
      <ProductGrid products={products} />
    </section>
  );
}
