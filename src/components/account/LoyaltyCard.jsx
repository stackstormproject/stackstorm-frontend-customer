import { getLoyalty } from '../../api/account';
import { useResource } from '../../hooks/useResource';
import { LoadingState, ErrorState } from '../ui/States';

const TIER_NAMES = { silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

/** FR027 tier, points and benefits from GET /loyalty. */
export function LoyaltyCard() {
  const loyalty = useResource(getLoyalty, []);
  if (loyalty.loading) return <LoadingState label="Loading rewards" />;
  if (loyalty.error) return <ErrorState error={loyalty.error} onRetry={loyalty.reload} />;
  const { tier, current_points: points, lifetime_points: lifetime, benefits = [] } = loyalty.data;
  return (
    <section className={`loyalty loyalty--${tier}`} aria-labelledby="loyalty-heading">
      <h2 id="loyalty-heading">{TIER_NAMES[tier] || tier} member</h2>
      <p className="loyalty__points">
        <strong>{Number(points).toLocaleString('en-LK')}</strong> points to spend
      </p>
      <p className="muted">{Number(lifetime).toLocaleString('en-LK')} points earned in total</p>
      {benefits.length > 0 && (
        <ul className="loyalty__benefits">
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
