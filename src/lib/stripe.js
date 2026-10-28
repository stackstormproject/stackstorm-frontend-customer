import { loadStripe } from '@stripe/stripe-js';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

let stripePromise = null;

/** Loads Stripe.js once, only when a publishable key is configured. */
export const getStripe = () => {
  if (!PUBLISHABLE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
};

export const isStripeConfigured = () => Boolean(PUBLISHABLE_KEY);
