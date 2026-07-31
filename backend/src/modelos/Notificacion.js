const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    tipo: { type: String, required: true, enum: ['success', 'warning', 'error', 'info', 'sistema'], default: 'info' },
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    entidadRelacionada: {
      tipo: { type: String, default: null },
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    leida: { type: Boolean, default: false, index: true },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

notificacionSchema.index({ usuario: 1, leida: 1, fecha: -1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);
