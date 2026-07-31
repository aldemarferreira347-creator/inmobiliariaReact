const Pago = require('../modelos/Pago');

async function crear({ reserva, monto, metodoPagoGuardado = null }, session) {
  const [pago] = await Pago.create([{ reserva, monto, metodoPagoGuardado }], { session });
  return pago;
}

async function buscarPorCheckoutSession(sessionId) {
  return Pago.findOne({ stripeCheckoutSessionId: sessionId });
}

async function buscarPorPaymentIntent(intentId) {
  return Pago.findOne({ stripePaymentIntentId: intentId });
}

async function obtenerPorReserva(reservaId) {
  return Pago.find({ reserva: reservaId }).sort({ createdAt: -1 });
}

module.exports = {
  crear,
  buscarPorCheckoutSession,
  buscarPorPaymentIntent,
  obtenerPorReserva,
};
