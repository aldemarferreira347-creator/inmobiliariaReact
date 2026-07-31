const mongoose = require('mongoose');

const metodoPagoGuardadoSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    stripeCustomerId: { type: String, required: true },
    // RN-19: nunca se persiste el numero completo de tarjeta ni el CVV - solo lo que Stripe expone
    // del PaymentMethod ya tokenizado (marca, ultimos 4, vencimiento). El schema no define campo
    // alguno para PAN/CVV.
    stripePaymentMethodId: { type: String, required: true, unique: true },
    marca: { type: String, required: true, trim: true },
    ultimos4: { type: String, required: true, trim: true, minlength: 4, maxlength: 4 },
    nombreTitular: { type: String, trim: true },
    mesExpiracion: { type: Number, required: true, min: 1, max: 12 },
    anioExpiracion: { type: Number, required: true },
    predeterminado: { type: Boolean, default: false },
    activo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MetodoPagoGuardado', metodoPagoGuardadoSchema);
