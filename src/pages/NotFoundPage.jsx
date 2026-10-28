import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/States';

export default function NotFoundPage() {
  return (
    <div className="container page">
      <EmptyState
        title="This page does not exist"
        action={
          <Link to="/shop" className="btn btn--primary">
            Browse the shop
          </Link>
        }
      >
        The link may be old, or the product may no longer be sold.
      </EmptyState>
    </div>
  );
}
