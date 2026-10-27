/** Visual stars with the number for screen readers. */
export function Stars({ rating, size = 'md' }) {
  const rounded = Math.round(Number(rating) * 2) / 2;
  return (
    <span className={`stars stars--${size}`} role="img" aria-label={`${rounded} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        let fill = 'empty';
        if (rounded >= n) fill = 'full';
        else if (rounded >= n - 0.5) fill = 'half';
        return (
          <span key={n} className={`star star--${fill}`} aria-hidden="true">
            ★
          </span>
        );
      })}
    </span>
  );
}
