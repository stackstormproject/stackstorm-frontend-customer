import { formatCountdown } from '../../lib/format';

const WARNING_SECONDS = 120;

/** Shows how long the 15-minute stock hold has left. */
export function HoldTimer({ seconds }) {
  return (
    <p className={`hold-timer ${seconds <= WARNING_SECONDS ? 'hold-timer--warning' : ''}`}>
      Your items are held for{' '}
      <strong>
        <time dateTime={`PT${seconds}S`}>{formatCountdown(seconds)}</time>
      </strong>
      . Pay before the timer ends to keep them.
      {seconds <= WARNING_SECONDS && (
        <span className="visually-hidden" role="alert">
          Less than 2 minutes left to pay.
        </span>
      )}
    </p>
  );
}
