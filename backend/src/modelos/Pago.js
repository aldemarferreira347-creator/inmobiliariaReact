const mongoose = require('mongoose');

const ESTADOS = ['PENDIENTE', 'PROCESANDO', 'PAGADO', 'RECHAZADO', 'REEMBOLSADO', 'EXPIRADO'];

const pagoSchema = new mongoose.Schema(
  {
    reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true, index: true },
    monto: { type: Number, required: true, min: 0 },
    estado: { type: String, enum: ESTADOS, default: 'PENDIENTE', index: true },
    // Flujo Checkout Session (redireccion a pagina alojada por Stripe).
    stripeCheckoutSessionId: { type: String, default: null },
    // Flujo PaymentIntent (tarjeta guardada, confirmado server-side) o el PI resultante de un Checkout.
    stripePaymentIntentId: { type: String, default: null },
    metodoPagoGuardado: { type: mongoose.Schema.Types.ObjectId, ref: 'MetodoPagoGuardado', default: null },
  },
  { timestamps: true }
);

// Guarda equivalente a uk_transaccion_pasarela del PHP original: nunca dos registros de pago
// locales para el mismo PaymentIntent de Stripe.
pagoSchema.index({ stripePaymentIntentId: 1 }, { unique: true, partialFilterExpression: { stripePaymentIntentId: { $type: 'string' } } });
pagoSchema.index({ stripeCheckoutSessionId: 1 }, { unique: true, partialFilterExpression: { stripeCheckoutSessionId: { $type: 'string' } } });

module.exports = mongoose.model('Pago', pagoSchema);
module.exports.ESTADOS = ESTADOS;
