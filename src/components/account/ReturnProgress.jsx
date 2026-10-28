import { returnSteps } from '../../lib/returns';
import { formatDate } from '../../lib/format';

/** Where a return or exchange stands, shown under the item it is for (#177). */
export function ReturnProgress({ request }) {
  const steps = returnSteps(request.status, request.type);
  const kind = request.type === 'exchange' ? 'Exchange' : 'Return';
  return (
    <div className="return-progress">
      <p className="return-progress__title">
        {kind} requested {formatDate(request.created_at)}
        {request.reason && <span className="muted">: {request.reason}</span>}
      </p>
      <ol className="return-progress__steps" aria-label={`${kind} progress`}>
        {steps.map((step) => (
          <li
            key={step.label}
            className={`return-step return-step--${step.state}`}
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            {step.label}
          </li>
        ))}
      </ol>
      {request.admin_note && (
        <p className="return-progress__note">Note from the shop: {request.admin_note}</p>
      )}
    </div>
  );
}
