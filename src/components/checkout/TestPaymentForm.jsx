import { useState } from 'react';
import { formatPrice } from '../../lib/format';

/**
 * Shown only when the backend reports provider "mock" (no Stripe key, never in production).
 * It is labelled as a test so nobody mistakes it for a real charge.
 */
export function TestPaymentForm({ paymentIntentId, amount, onPaid, disabled }) {
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    setError(null);
    try {
      await onPaid(paymentIntentId);
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  return (
    <div className="payment-form payment-form--test">
      <p className="test-banner">
        Test mode: card payments are not set up on this environment, so no money is taken.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={pay}
        disabled={paying || disabled}
      >
        {paying ? 'Confirming…' : `Place test order for ${formatPrice(amount)}`}
      </button>
    </div>
  );
}
