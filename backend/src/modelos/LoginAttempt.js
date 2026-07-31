const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema(
  {
    correo: { type: String, required: true, lowercase: true, trim: true, index: true },
    ip: { type: String, required: true, index: true },
    exitoso: { type: Boolean, required: true },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

loginAttemptSchema.index({ correo: 1, ip: 1, fecha: -1 });
// Higiene: purga intentos con mas de 24h (no altera el comportamiento observable de bloqueo de 1h).
loginAttemptSchema.index({ fecha: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
