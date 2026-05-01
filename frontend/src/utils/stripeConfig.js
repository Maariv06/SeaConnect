// frontend/src/utils/stripeConfig.js
import { loadStripe } from '@stripe/stripe-js';

// Replace with your Stripe publishable key (test mode)
export const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY);

// You can get this from https://dashboard.stripe.com/test/apikeys