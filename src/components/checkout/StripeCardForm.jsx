import { useState } from 'react';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { getStripe } from '../../lib/stripe';
import { formatPrice } from '../../lib/format';

const CARD_STYLE = {
  style: {
    base: { fontSize: '16px', color: '#0F172A', '::placeholder': { color: '#94A3B8' } },
    invalid: { color: '#B42318' },
  },
  hidePostalCode: true,
};

function CardForm({ clientSecret, amount, billingName, onPaid, disabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  const pay = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: { name: billingName || undefined },
      },
    });
    if (result.error) {
      setError(result.error.message);
      setPaying(false);
      return;
    }
    try {
      await onPaid(result.paymentIntent.id);
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  };

  return (
    <form onSubmit={pay} className="payment-form">
      <label className="field__label" htmlFor="card-element">
        Card details
      </label>
      <div className="card-element" id="card-element">
        <CardElement options={CARD_STYLE} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="btn btn--primary btn--block"
        disabled={!stripe || paying || disabled}
      >
        {paying ? 'Processing payment…' : `Pay ${formatPrice(amount)}`}
      </button>
      <p className="payment-form__note">
        Card details go straight to Stripe and never touch our servers.
      </p>
    </form>
  );
}

/** FR013 card payment via Stripe Elements (PCI DSS: the card never reaches our backend). */
export function StripeCardForm(props) {
  return (
    <Elements stripe={getStripe()}>
      <CardForm {...props} />
    </Elements>
  );
}
