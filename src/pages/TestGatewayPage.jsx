import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { formatPrice } from '../lib/format';

// #202: styled after the "Bank Card" mockup - a labelled card form (holder's name, card
// number, expiry, CVV) in front of PayHere's own gateway chrome. No card data is sent anywhere;
// the order is still settled by the mock session created at /payments/checkout-session (#182).
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CARD_NUMBER_PATTERN = /^[\d ]{19}$/; // 16 digits, grouped in 4s

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

/**
 * Stands in for the hosted payment page when no Stripe key is set (development and CI only;
 * the backend never offers it in production). It is labelled as a test everywhere and returns
 * to the shop exactly as Stripe Checkout, or PayHere, would (#182).
 */
export default function TestGatewayPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [cardName, setCardName] = useState('Jane Perera');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const orderId = params.get('order');
  const sessionId = params.get('session_id');
  const amount = Number(params.get('amount'));
  const back = `/checkout/complete?order=${encodeURIComponent(orderId || '')}`;

  useEffect(() => {
    document.title = 'Test payment gateway';
  }, []);

  const cardValid =
    cardName.trim().length > 1 &&
    CARD_NUMBER_PATTERN.test(cardNumber) &&
    EXPIRY_PATTERN.test(expiry) &&
    /^\d{3,4}$/.test(cvv);

  const pay = () => {
    setPaying(true);
    // Mimic the gateway's own processing pause before it sends the shopper back.
    setTimeout(() => navigate(`${back}&session_id=${encodeURIComponent(sessionId || '')}`), 900);
  };

  return (
    <main className="gateway">
      <div className="gateway__panel">
        <p className="gateway__badge">Test mode: no real payment is taken</p>
        <h1>Test payment gateway</h1>
        <p className="gateway__merchant">Paying Dickwella Fashion Corner</p>
        <p className="gateway__amount">{Number.isFinite(amount) ? formatPrice(amount) : ''}</p>
        <p className="muted">Order #{orderId}</p>

        <form
          className="gateway__form"
          onSubmit={(event) => {
            event.preventDefault();
            pay();
          }}
        >
          <label className="field" htmlFor="card-name">
            <span className="field__label">Card Holder&apos;s Name</span>
            <input
              id="card-name"
              className="field__control"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              autoComplete="cc-name"
              disabled={paying}
            />
          </label>
          <label className="field" htmlFor="card-number">
            <span className="field__label">Card Number</span>
            <input
              id="card-number"
              className="field__control"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              disabled={paying}
            />
          </label>
          <div className="gateway__form-row">
            <label className="field" htmlFor="card-expiry">
              <span className="field__label">Expiry (MM/YY)</span>
              <input
                id="card-expiry"
                className="field__control"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                disabled={paying}
              />
            </label>
            <label className="field" htmlFor="card-cvv">
              <span className="field__label">CVV</span>
              <input
                id="card-cvv"
                className="field__control"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                disabled={paying}
              />
            </label>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={paying || !orderId || !sessionId || !cardValid}
          >
            <Lock size={16} aria-hidden="true" />
            {paying ? 'Processing…' : `Pay ${formatPrice(amount)}`}
          </button>
        </form>
        <button
          type="button"
          className="btn btn--ghost btn--block"
          disabled={paying}
          onClick={() => navigate(`${back}&cancelled=1`)}
        >
          Cancel and return to the shop
        </button>
        <p className="gateway__note gateway__note--payhere">
          PayHere is a Central Bank approved Secure Payment Gateway Service
        </p>
        <p className="gateway__note">
          With a Stripe key on the backend this page is Stripe&apos;s secure checkout instead.
        </p>
      </div>
    </main>
  );
}
