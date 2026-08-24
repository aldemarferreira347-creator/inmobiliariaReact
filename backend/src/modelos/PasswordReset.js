const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    tokenHash: { type: String, required: true },
    // Solo se llena en el flujo de "cambio de contrasena" iniciado por un usuario ya autenticado
    // (HU-25): el nuevo hash se calcula al solicitar el cambio y se aplica recien al confirmar el
    // enlace enviado por correo. En el flujo de "olvide mi contrasena" queda null.
    nuevaContrasenaHash: { type: String, default: null },
    expiraEn: { type: Date, required: true },
    usado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL: Mongo borra el documento automaticamente al llegar expiraEn (equivalente a los 60 min de HU-24).
passwordResetSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
