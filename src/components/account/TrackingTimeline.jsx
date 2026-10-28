import { formatDate } from '../../lib/format';

/** FR010 status timeline from GET /orders/:id/track. */
export function TrackingTimeline({ tracking, trackingNumber }) {
  const cancelled = tracking.current_status === 'cancelled';
  return (
    <section aria-labelledby="tracking-heading" className="tracking">
      <h2 id="tracking-heading">Tracking</h2>
      {cancelled ? (
        <p>This order was cancelled.</p>
      ) : (
        <>
          <ol className="timeline">
            {tracking.milestones
              .filter((m) => m.key !== 'cancelled')
              .map((milestone) => (
                <li
                  key={milestone.key}
                  className={`timeline__step timeline__step--${milestone.status}`}
                  aria-current={milestone.status === 'current' ? 'step' : undefined}
                >
                  <span className="timeline__title">{milestone.title}</span>
                  {milestone.timestamp && (
                    <span className="muted">{formatDate(milestone.timestamp)}</span>
                  )}
                </li>
              ))}
          </ol>
          {tracking.current_status !== 'delivered' && tracking.estimated_delivery && (
            <p>Expected by {formatDate(tracking.estimated_delivery)}.</p>
          )}
          {trackingNumber && (
            <p>
              Courier tracking number: <strong>{trackingNumber}</strong>
            </p>
          )}
        </>
      )}
    </section>
  );
}
