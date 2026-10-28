import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SHIPPING_METHODS,
  initiateCheckout,
  createPaymentIntent,
  confirmPayment,
  releaseReservation,
} from '../api/checkout';
import { listAddresses, addAddress } from '../api/account';
import { removeCartItem } from '../api/cart';
import { useAuth } from '../state/AuthContext';
import { useCart, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from '../state/CartContext';
import { useToast } from '../state/ToastContext';
import { useResource } from '../hooks/useResource';
import { useCountdown } from '../hooks/useCountdown';
import { rememberGuestOrder } from '../lib/session';
import { validateAddress, validateEmail, hasErrors } from '../lib/validation';
import { FormField } from '../components/ui/FormField';
import { LoadingState, EmptyState } from '../components/ui/States';
import {
  AddressFields,
  EMPTY_ADDRESS,
  fromSavedAddress,
  toCheckoutAddress,
  formatAddressLines,
} from '../components/checkout/AddressFields';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { HoldTimer } from '../components/checkout/HoldTimer';
import { StripeCardForm } from '../components/checkout/StripeCardForm';
import { TestPaymentForm } from '../components/checkout/TestPaymentForm';

const NEW_ADDRESS = 'new';

/** Same delivery rule as checkout.service, used only until the server returns real totals. */
const estimateTotals = (subtotal, method) => {
  const shipping =
    method === 'pickup' || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  return {
    subtotal,
    shipping_fee: shipping,
    discount_amount: 0,
    total_amount: subtotal + shipping,
  };
};

function PaymentStep({ checkout, customerName, onPaid, onExpired, onChangeDetails }) {
  const seconds = useCountdown(checkout.expiresAt, onExpired);
  const headingRef = useRef(null);
  const { intent } = checkout;

  // Moving to a new step: bring it into view and put keyboard focus on its heading.
  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <section aria-labelledby="payment-heading" className="checkout__step">
      <h2 id="payment-heading" ref={headingRef} tabIndex={-1}>
        Payment
      </h2>
      <HoldTimer seconds={seconds} />
      <div className="checkout__review">
        <h3>Delivering to</h3>
        <address>
          {formatAddressLines(checkout.shippingAddress).map((lineText) => (
            <span key={lineText}>{lineText}</span>
          ))}
        </address>
        <button type="button" className="btn--link" onClick={onChangeDetails}>
          Change details
        </button>
      </div>
      {intent.provider === 'stripe' ? (
        <StripeCardForm
          clientSecret={intent.clientSecret}
          amount={intent.amount}
          billingName={customerName}
          onPaid={onPaid}
          disabled={seconds === 0}
        />
      ) : (
        <TestPaymentForm
          paymentIntentId={intent.paymentIntentId}
          amount={intent.amount}
          onPaid={onPaid}
          disabled={seconds === 0}
        />
      )}
    </section>
  );
}

export default function CheckoutPage() {
  const { customer, isSignedIn, status } = useAuth();
  const { items, subtotal, loadState, hasUnavailableItems, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [pickedAddress, setAddressChoice] = useState(null); // null = use the default
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState('standard');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkout, setCheckout] = useState(null); // set once the order and hold exist
  const [expired, setExpired] = useState(false);

  const saved = useResource(
    () => (isSignedIn ? listAddresses() : Promise.resolve([])),
    [isSignedIn]
  );
  const savedAddresses = useMemo(() => saved.data || [], [saved.data]);

  // Until the shopper picks, use their default saved address (derived, so there is no flicker).
  const preferred = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
  const addressChoice = pickedAddress ?? (preferred ? String(preferred.id) : NEW_ADDRESS);

  useEffect(() => {
    document.title = 'Checkout | Dickwella Fashion Corner';
  }, []);

  if (status === 'checking' || loadState === 'idle' || loadState === 'loading') {
    return <LoadingState label="Preparing checkout" />;
  }

  if (!items.length && !checkout) {
    return (
      <div className="container page">
        <EmptyState
          title="Your bag is empty"
          action={
            <Link to="/shop" className="btn btn--secondary">
              Start shopping
            </Link>
          }
        >
          Add something to your bag before checking out.
        </EmptyState>
      </div>
    );
  }

  const chosenAddress =
    addressChoice === NEW_ADDRESS
      ? address
      : fromSavedAddress(savedAddresses.find((a) => String(a.id) === addressChoice) || {});

  const validate = () => {
    const found = {};
    if (!isSignedIn) {
      const emailError = validateEmail(email);
      if (emailError) found.email = emailError;
    }
    // The server needs a valid address for collection orders too (used for billing).
    Object.assign(found, validateAddress(chosenAddress));
    return found;
  };

  const startPayment = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    if (hasUnavailableItems) {
      setFormError(
        'Some items in your bag are no longer available in that quantity. Update your bag first.'
      );
      return;
    }
    setSubmitting(true);
    try {
      const shippingAddress = toCheckoutAddress(chosenAddress);
      const order = await initiateCheckout({
        items,
        shippingAddress,
        shippingMethod: method,
        guestEmail: isSignedIn ? undefined : email.trim(),
        notes: notes.trim(),
      });
      if (order.guest_order_token) rememberGuestOrder(order.order_id, order.guest_order_token);
      if (isSignedIn && addressChoice === NEW_ADDRESS && saveAddress) {
        addAddress(chosenAddress).catch(() =>
          toast.info('Your address could not be saved for next time.')
        );
      }
      const intent = await createPaymentIntent(order.order_id);
      setCheckout({
        orderId: order.order_id,
        reservationId: order.reservation_id,
        expiresAt: Date.now() + Number(order.expires_in || 900) * 1000,
        breakdown: order.breakdown,
        items: order.items,
        shippingAddress,
        intent,
      });
      setExpired(false);
    } catch (error) {
      if (error.status === 409) {
        setFormError('Some items sold out while you were checking out. Your bag has been updated.');
        refresh().catch(() => {});
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const releaseHold = () => {
    if (checkout?.reservationId) releaseReservation(checkout.reservationId).catch(() => {});
  };

  const backToDetails = () => {
    releaseHold();
    setCheckout(null);
  };

  const onExpired = () => {
    releaseHold();
    setCheckout(null);
    setExpired(true);
  };

  const onPaid = async (paymentIntentId) => {
    const { orderId } = checkout;
    await confirmPayment(orderId, paymentIntentId);
    // The order now owns these items; clear them from the bag.
    await Promise.allSettled(items.map((item) => removeCartItem(item.id)));
    refresh().catch(() => {});
    navigate(`/orders/${orderId}/confirmation`, { replace: true });
  };

  return (
    <div className="container page checkout">
      <h1>Checkout</h1>
      <ol className="steps" aria-label="Checkout progress">
        <li
          aria-current={checkout ? undefined : 'step'}
          className={checkout ? 'is-done' : 'is-current'}
        >
          Details
        </li>
        <li aria-current={checkout ? 'step' : undefined} className={checkout ? 'is-current' : ''}>
          Payment
        </li>
      </ol>

      <div className="checkout__layout">
        <div>
          {expired && (
            <p className="form-error" role="alert">
              The 15-minute hold ended, so your items went back on sale. Check your details and
              continue to place the order again.
            </p>
          )}

          {checkout ? (
            <PaymentStep
              checkout={checkout}
              customerName={customer?.name}
              onPaid={onPaid}
              onExpired={onExpired}
              onChangeDetails={backToDetails}
            />
          ) : (
            <form onSubmit={startPayment} noValidate className="checkout__step">
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}

              <section aria-labelledby="contact-heading">
                <h2 id="contact-heading">Contact</h2>
                {isSignedIn ? (
                  <p>
                    Signed in as <strong>{customer?.email}</strong>
                  </p>
                ) : (
                  <>
                    <FormField
                      label="Email for your receipt"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                    />
                    <p className="muted">
                      Checking out as a guest. <Link to="/sign-in?next=%2Fcheckout">Sign in</Link>{' '}
                      to use saved addresses.
                    </p>
                  </>
                )}
              </section>

              <fieldset className="checkout__group">
                <legend>
                  <h2>Delivery</h2>
                </legend>
                {SHIPPING_METHODS.map((option) => (
                  <label key={option.value} className="choice">
                    <input
                      type="radio"
                      name="shipping"
                      value={option.value}
                      checked={method === option.value}
                      onChange={() => setMethod(option.value)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <span className="muted">{option.detail}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="checkout__group">
                <legend>
                  <h2>{method === 'pickup' ? 'Billing address' : 'Delivery address'}</h2>
                </legend>
                {savedAddresses.length > 0 &&
                  savedAddresses.map((entry) => (
                    <label key={entry.id} className="choice">
                      <input
                        type="radio"
                        name="address"
                        value={entry.id}
                        checked={addressChoice === String(entry.id)}
                        onChange={() => setAddressChoice(String(entry.id))}
                      />
                      <span>{formatAddressLines(entry).join(', ')}</span>
                    </label>
                  ))}
                {savedAddresses.length > 0 && (
                  <label className="choice">
                    <input
                      type="radio"
                      name="address"
                      value={NEW_ADDRESS}
                      checked={addressChoice === NEW_ADDRESS}
                      onChange={() => setAddressChoice(NEW_ADDRESS)}
                    />
                    <span>Use a new address</span>
                  </label>
                )}
                {addressChoice === NEW_ADDRESS && (
                  <>
                    <AddressFields value={address} errors={errors} onChange={setAddress} />
                    {isSignedIn && (
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                        />
                        Save this address for next time
                      </label>
                    )}
                  </>
                )}
                {addressChoice !== NEW_ADDRESS && hasErrors(errors) && (
                  <p className="field__error" role="alert">
                    The saved address is incomplete. Choose another or enter a new one.
                  </p>
                )}
              </fieldset>

              <FormField
                as="textarea"
                label="Delivery note (optional)"
                value={notes}
                maxLength={300}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                {submitting ? 'Holding your items…' : 'Continue to payment'}
              </button>
              <p className="muted checkout__hint">
                We hold your items for 15 minutes while you pay.
              </p>
            </form>
          )}
        </div>

        <OrderSummary
          items={checkout ? checkout.items : items}
          breakdown={checkout?.breakdown}
          estimate={estimateTotals(subtotal, method)}
        />
      </div>
    </div>
  );
}
