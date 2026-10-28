import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listReviews, createReview } from '../../api/catalog';
import { useResource } from '../../hooks/useResource';
import { useAuth } from '../../state/AuthContext';
import { useToast } from '../../state/ToastContext';
import { formatDate } from '../../lib/format';
import { Stars } from './Stars';
import { FormField } from '../ui/FormField';
import { LoadingState, ErrorState } from '../ui/States';
import { Pagination } from '../catalog/Pagination';

const COMMENT_MAX = 1000;

function ReviewForm({ productId, onCreated }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) {
      setError('Choose a star rating.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createReview(productId, { rating, comment: comment.trim() });
      toast.success('Thanks, your review is published');
      onCreated();
    } catch (err) {
      if (err.status === 403) setError('Only customers who bought this item can review it.');
      else if (err.status === 409) setError('You have already reviewed this item.');
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <fieldset className="option-group">
        <legend>Your rating</legend>
        <div className="rating-input">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={n <= rating ? 'is-on' : ''}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
              />
              <span aria-hidden="true">★</span>
              <span className="visually-hidden">{`${n} star${n > 1 ? 's' : ''}`}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <FormField
        as="textarea"
        label="Your review (optional)"
        value={comment}
        maxLength={COMMENT_MAX}
        onChange={(e) => setComment(e.target.value)}
        hint={`${comment.length}/${COMMENT_MAX}`}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? 'Publishing…' : 'Publish review'}
      </button>
    </form>
  );
}

/** FR008 reviews: summary, list with pages, and a form for verified purchasers. */
export function Reviews({ productId, slug }) {
  const { isSignedIn } = useAuth();
  const [page, setPage] = useState(1);
  const [writing, setWriting] = useState(false);
  const reviews = useResource(() => listReviews(productId, page), [productId, page]);

  const count = reviews.data?.stats?.review_count ?? 0;

  return (
    <section className="reviews" aria-labelledby="reviews-heading">
      <div className="section-head">
        <h2 id="reviews-heading">Reviews</h2>
        {isSignedIn && !writing && (
          <button type="button" className="btn btn--secondary" onClick={() => setWriting(true)}>
            Write a review
          </button>
        )}
        {!isSignedIn && (
          <Link to={`/sign-in?next=${encodeURIComponent(`/products/${slug}`)}`}>
            Sign in to review
          </Link>
        )}
      </div>

      {writing && (
        <ReviewForm
          productId={productId}
          onCreated={() => {
            setWriting(false);
            setPage(1);
            reviews.reload();
          }}
        />
      )}

      {reviews.loading && <LoadingState label="Loading reviews" />}
      {reviews.error && <ErrorState error={reviews.error} onRetry={reviews.reload} />}
      {reviews.data && count === 0 && <p>No reviews yet.</p>}
      {reviews.data && count > 0 && (
        <>
          <p className="reviews__summary">
            <Stars rating={reviews.data.stats.average_rating} />
            <span>
              {Number(reviews.data.stats.average_rating).toFixed(1)} from {count}{' '}
              {count === 1 ? 'review' : 'reviews'}
            </span>
          </p>
          <ul className="reviews__list">
            {reviews.data.reviews.map((review) => (
              <li key={review.id} className="review">
                <Stars rating={review.rating} size="sm" />
                {review.comment && <p>{review.comment}</p>}
                <p className="review__meta">
                  {review.customer_name}, {formatDate(review.created_at)}
                  {review.is_verified_buyer && (
                    <span className="review__badge">Verified purchase</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={reviews.data.pagination?.total_pages}
            onChange={setPage}
          />
        </>
      )}
    </section>
  );
}
