const mongoose = require('mongoose');

const historialReservaSchema = new mongoose.Schema(
  {
    reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true, index: true },
    estadoAnterior: { type: String, required: true },
    estadoNuevo: { type: String, required: true },
    // null = accion automatica del sistema (CRON de expiracion), igual que cambiado_por=NULL en el PHP original.
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    motivo: { type: String, trim: true },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HistorialReserva', historialReservaSchema);
