// utils/stripeConfig.js
import { loadStripe } from '@stripe/stripe-js';

// Your Stripe publishable key
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);