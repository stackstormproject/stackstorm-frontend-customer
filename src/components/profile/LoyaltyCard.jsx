import React from 'react';
import { Award, Sparkles, TrendingUp, ShieldCheck, Gift, Clock, AlertCircle } from 'lucide-react';
import './LoyaltyCard.css';

/**
 * LoyaltyCard Component
 *
 * Displays customer's Ceylon Heritage Loyalty status, accrued points,
 * tier progress bar, and 12-month rolling expiration policy (AC3).
 * Defensively handles null/undefined loyalty objects per Failure Recovery Matrix.
 */
export function LoyaltyCard({ loyalty, className = '' }) {
  // Defensive fallback per Failure Recovery Matrix
  const safeLoyalty = loyalty || {
    tier: 'silver',
    points: 0,
    total_spent: 0,
    points_to_next_tier: 1000,
    spend_to_next: 100000,
    accrual_rate: '1 pt per LKR 100',
    expires_in_months: 12,
  };

  const tier = (safeLoyalty.tier || 'silver').toLowerCase();
  const points = Number(safeLoyalty.points) || 0;
  const totalSpent = Number(safeLoyalty.total_spent) || 0;
  const spendToNext = Number(safeLoyalty.spend_to_next) || 0;

  // Tier threshold limits in LKR
  const tierThresholds = {
    silver: { max: 25000, nextTier: 'Gold' },
    gold: { max: 100000, nextTier: 'Platinum' },
    platinum: { max: 250000, nextTier: 'Diamond Atelier' },
  };

  const currentTierInfo = tierThresholds[tier] || tierThresholds.silver;
  const progressPercent = Math.min(
    100,
    Math.max(5, Math.round((totalSpent / (totalSpent + spendToNext || 1)) * 100))
  );

  return (
    <div className={`loyalty-card loyalty-card--${tier} ${className}`} data-testid="loyalty-card">
      {/* Top Banner with Tier Badge */}
      <div className="loyalty-card__header">
        <div className="loyalty-card__badge-wrapper">
          <div className={`loyalty-badge loyalty-badge--${tier}`} data-testid="loyalty-tier-badge">
            <Award size={18} />
            <span className="loyalty-badge__text">{tier.toUpperCase()} TIER</span>
          </div>
          <span className="loyalty-card__program-name">Ceylon Heritage Rewards</span>
        </div>

        <div className="loyalty-card__points-box">
          <div className="loyalty-card__points-val" data-testid="loyalty-points-balance">
            {points.toLocaleString()}
          </div>
          <div className="loyalty-card__points-label">Available Points</div>
        </div>
      </div>

      {/* Progress Meter to Next Tier */}
      <div className="loyalty-card__progress-section">
        <div className="loyalty-card__progress-labels">
          <span>
            Current: <strong>{tier.charAt(0).toUpperCase() + tier.slice(1)}</strong>
          </span>
          {spendToNext > 0 ? (
            <span data-testid="loyalty-next-tier-label">
              LKR {spendToNext.toLocaleString()} to <strong>{currentTierInfo.nextTier}</strong>
            </span>
          ) : (
            <span className="loyalty-card__max-tier">Maximum Tier Achieved ✨</span>
          )}
        </div>

        <div
          className="loyalty-progress-track"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          data-testid="loyalty-progress-bar"
        >
          <div className="loyalty-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="loyalty-card__accrual-rate">
          <TrendingUp size={14} />
          <span>
            Earning Rate: <strong>{safeLoyalty.accrual_rate || '1 pt per LKR 100'}</strong> on
            handloom textiles
          </span>
        </div>
      </div>

      {/* Tier Benefits Grid */}
      <div className="loyalty-card__perks-grid">
        <div className="loyalty-perk-item">
          <Gift size={16} />
          <span>Free Islandwide Express on Orders &gt; LKR 10,000</span>
        </div>
        <div className="loyalty-perk-item">
          <Sparkles size={16} />
          <span>Early VIP Access to Seasonal Batik Collections</span>
        </div>
        <div className="loyalty-perk-item">
          <ShieldCheck size={16} />
          <span>Dedicated Southern Province Courier Care</span>
        </div>
      </div>

      {/* Expiry Policy Note */}
      <div className="loyalty-card__policy-footer" data-testid="loyalty-policy-note">
        <Clock size={14} />
        <span>
          Points valid for <strong>{safeLoyalty.expires_in_months || 12} months</strong> from date
          of accrual. Points redeemable against future handloom purchases at LKR 1 per point.
        </span>
      </div>
    </div>
  );
}

export default LoyaltyCard;
