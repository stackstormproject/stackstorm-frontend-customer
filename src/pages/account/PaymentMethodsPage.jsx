import { useState } from 'react';
import {
  listPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
} from '../../api/account';
import { useResource } from '../../hooks/useResource';
import { useToast } from '../../state/ToastContext';
import { LoadingState, ErrorState } from '../../components/ui/States';

const BRAND_LABEL = (brand) => (brand || 'card').replace(/^\w/, (c) => c.toUpperCase());

/** #190 (FR-012, FR-010): cards saved on the payment page; choose a default or remove one. */
export default function PaymentMethodsPage() {
  const methods = useResource(listPaymentMethods, []);
  const toast = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const run = async (action, message) => {
    try {
      await action();
      toast.success(message);
      setConfirmingDelete(null);
      methods.reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (methods.loading) return <LoadingState label="Loading saved cards" />;
  if (methods.error) return <ErrorState error={methods.error} onRetry={methods.reload} />;
  const list = methods.data || [];

  return (
    <section aria-labelledby="payment-methods-heading">
      <h2 id="payment-methods-heading">Payment methods</h2>
      <p>
        Cards you chose to save on the payment page. We only keep the brand, last 4 digits and
        expiry.
      </p>

      {!list.length && <p>You have no saved cards yet.</p>}

      <ul className="payment-method-list">
        {list.map((method) => (
          <li key={method.id} className="payment-method-card">
            <div className="payment-method-card__detail">
              <span className="payment-method-card__brand">
                {`${BRAND_LABEL(method.brand)} ending ${method.last4}`}
              </span>
              <span className="payment-method-card__expiry">
                {`Expires ${String(method.exp_month).padStart(2, '0')}/${method.exp_year}${
                  method.is_test ? ' · Test card' : ''
                }`}
              </span>
            </div>
            {method.is_default && <p className="payment-method-card__default">Default card</p>}
            <div className="payment-method-card__actions">
              {!method.is_default && (
                <button
                  type="button"
                  className="btn--link"
                  onClick={() =>
                    run(() => setDefaultPaymentMethod(method.id), 'Default card updated')
                  }
                >
                  Make default
                </button>
              )}
              {confirmingDelete === method.id ? (
                <span className="confirm-inline" role="group" aria-label="Confirm delete">
                  Remove this card?{' '}
                  <button
                    type="button"
                    className="btn--link"
                    onClick={() => run(() => deletePaymentMethod(method.id), 'Card removed')}
                  >
                    Yes, remove
                  </button>{' '}
                  <button
                    type="button"
                    className="btn--link"
                    onClick={() => setConfirmingDelete(null)}
                  >
                    Keep it
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="btn--link"
                  onClick={() => setConfirmingDelete(method.id)}
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
