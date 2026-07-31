const Stripe = require('stripe');
const entorno = require('./entorno');

const stripe = new Stripe(entorno.stripe.secretKey);

module.exports = stripe;
