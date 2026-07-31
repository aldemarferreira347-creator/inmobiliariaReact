import { loadStripe } from '@stripe/stripe-js';

let promesaStripe;

export function obtenerStripe() {
  if (!promesaStripe) {
    promesaStripe = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
  }
  return promesaStripe;
}
