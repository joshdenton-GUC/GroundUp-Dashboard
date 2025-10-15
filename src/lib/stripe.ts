import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe publishable key - replace with your actual publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Pricing configuration
export const JOB_PRICING = {
  STANDARD: {
    price: 500,
    label: 'Standard (Worker/Tradesman)',
    description: 'For general tradesmen positions',
    priceId: 'price_1QXXXXXXXXXXXXX', // Replace with actual Stripe price ID
  },
  PREMIUM: {
    price: 1500,
    label: 'Premium (Project Manager, Superintendent, Executive)',
    description: 'For leadership and management positions',
    priceId: 'price_1QXXXXXXXXXXXXX', // Replace with actual Stripe price ID
  },
} as const;

export type JobClassification = keyof typeof JOB_PRICING;
