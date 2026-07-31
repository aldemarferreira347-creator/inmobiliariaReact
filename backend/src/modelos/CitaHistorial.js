const mongoose = require('mongoose');

const citaHistorialSchema = new mongoose.Schema(
  {
    cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita', required: true, index: true },
    accion: { type: String, required: true, enum: ['creada', 'asignada', 'reasignada', 'cancelada', 'realizada'] },
    usuarioResponsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    detalle: { type: String },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('CitaHistorial', citaHistorialSchema);
