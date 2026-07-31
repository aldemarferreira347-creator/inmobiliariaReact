const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    tokenHash: { type: String, required: true },
    expiraEn: { type: Date, required: true },
    usado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL: Mongo borra el documento automaticamente al llegar expiraEn (equivalente a los 60 min de HU-24).
passwordResetSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
