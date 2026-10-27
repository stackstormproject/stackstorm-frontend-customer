import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../state/WishlistContext';
import { useToast } from '../../state/ToastContext';

export function WishlistButton({ productId, productName, variant = 'icon' }) {
  const { isSaved, toggle } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const saved = isSaved(productId);

  const onClick = async () => {
    setBusy(true);
    try {
      const nowSaved = await toggle(productId);
      toast.success(
        nowSaved ? `Saved ${productName}` : `Removed ${productName} from your wishlist`
      );
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        toast.info('Sign in to save items to your wishlist.');
        navigate(`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`);
      } else {
        toast.error(error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`wishlist-button wishlist-button--${variant} ${saved ? 'is-saved' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      onClick={onClick}
      disabled={busy}
    >
      <Heart size={18} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
      {variant === 'text' && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
