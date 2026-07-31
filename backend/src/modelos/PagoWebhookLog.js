const mongoose = require('mongoose');

// Idempotencia de webhooks de Stripe: el indice unico en stripeEventId hace que un evento
// reintentado por Stripe (o entregado dos veces) nunca se procese de negocio mas de una vez -
// equivalente a INSERT IGNORE sobre (pasarela, evento_id) en el PHP original.
const pagoWebhookLogSchema = new mongoose.Schema(
  {
    stripeEventId: { type: String, required: true, unique: true },
    tipo: { type: String, required: true },
    procesado: { type: Boolean, default: false },
    procesadoEn: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PagoWebhookLog', pagoWebhookLogSchema);
