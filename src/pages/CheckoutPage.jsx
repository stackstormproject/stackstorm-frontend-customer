import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SHIPPING_METHODS,
  initiateCheckout,
  createCheckoutSession,
  paymentPageFor,
  validatePromoCode,
} from '../api/checkout';
import { listAddresses, addAddress } from '../api/account';
import { leaveFor } from '../lib/redirect';
import { useAuth } from '../state/AuthContext';
import { useCart, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from '../state/CartContext';
import { useToast } from '../state/ToastContext';
import { useResource } from '../hooks/useResource';
import { rememberGuestOrder } from '../lib/session';
import { validateAddress, validateEmail, hasErrors } from '../lib/validation';
import { FormField } from '../components/ui/FormField';
import { Price } from '../components/ui/Price';
import { LoadingState, EmptyState } from '../components/ui/States';
import {
  AddressFields,
  EMPTY_ADDRESS,
  fromSavedAddress,
  toCheckoutAddress,
  formatAddressLines,
} from '../components/checkout/AddressFields';
import { OrderSummary } from '../components/checkout/OrderSummary';

const NEW_ADDRESS = 'new';

/** Same delivery rule as checkout.service, used only until the server returns real totals. */
const estimateTotals = (subtotal, method, discountAmount = 0) => {
  const shipping =
    method === 'pickup' || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  // The server caps the promo discount at the goods subtotal; mirror that here so the
  // preview never shows a negative total.
  const discount = Math.min(discountAmount, subtotal);
  return {
    subtotal,
    shipping_fee: shipping,
    discount_amount: Number(discount.toFixed(2)),
    total_amount: Number((subtotal + shipping - discount).toFixed(2)),
  };
};

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
  const [redirecting, setRedirecting] = useState(false);

  // #201: a promo code can be applied as a checkout discount.
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, discountAmount } | null
  const [promoError, setPromoError] = useState(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

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

  if (!items.length && !redirecting) {
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

  const promoDiscount = appliedPromo?.discountAmount || 0;

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setCheckingPromo(true);
    setPromoError(null);
    try {
      const result = await validatePromoCode(code, subtotal);
      setAppliedPromo({ code: result.code, discountAmount: result.discountAmount });
    } catch (error) {
      setAppliedPromo(null);
      setPromoError(error.message);
    } finally {
      setCheckingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
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
        promoCode: appliedPromo?.code,
      });
      if (order.guest_order_token) rememberGuestOrder(order.order_id, order.guest_order_token);
      if (isSignedIn && addressChoice === NEW_ADDRESS && saveAddress) {
        addAddress(chosenAddress).catch(() =>
          toast.info('Your address could not be saved for next time.')
        );
      }
      // #182: payment happens on the hosted payment page; it sends the shopper back to
      // /checkout/complete, which verifies the payment and shows the confirmation.
      const session = await createCheckoutSession(order.order_id);
      const target = paymentPageFor(order.order_id, session);
      setRedirecting(true);
      if (target.route) navigate(target.route);
      else leaveFor(target.href);
    } catch (error) {
      if (error.status === 409) {
        setFormError('Some items sold out while you were checking out. Your bag has been updated.');
        refresh().catch(() => {});
      } else {
        setFormError(error.message);
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="container page checkout">
      <h1>Checkout</h1>
      <ol className="steps" aria-label="Checkout progress">
        <li aria-current="step" className="is-current">
          Details
        </li>
        <li>Payment</li>
        <li>Confirmation</li>
      </ol>

      <div className="checkout__layout">
        <div>
          {redirecting ? (
            <p className="checkout__redirect" role="status">
              Taking you to the secure payment page…
            </p>
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

              <fieldset className="checkout__group">
                <legend>
                  <h2>Discounts</h2>
                </legend>

                {appliedPromo ? (
                  <p className="checkout__promo-applied">
                    Promo code <strong>{appliedPromo.code}</strong> applied:{' '}
                    <Price amount={appliedPromo.discountAmount} /> off.{' '}
                    <button type="button" className="link-button" onClick={removePromo}>
                      Remove
                    </button>
                  </p>
                ) : (
                  <div className="checkout__promo">
                    <FormField
                      label="Promo code (optional)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      error={promoError}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={applyPromo}
                      disabled={checkingPromo || !promoInput.trim()}
                    >
                      {checkingPromo ? 'Checking…' : 'Apply'}
                    </button>
                  </div>
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
                You pay on a secure payment page; we hold your items for 15 minutes.
              </p>
            </form>
          )}
        </div>

        <OrderSummary items={items} estimate={estimateTotals(subtotal, method, promoDiscount)} />
      </div>
    </div>
  );
}
