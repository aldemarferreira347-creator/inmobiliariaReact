const mongoose = require('mongoose');

const ESTADOS = ['Pendiente', 'Asignada', 'Realizada', 'Cancelada'];

// Mapa de transiciones validas, igual que Cita::TRANSICIONES del PHP original.
const TRANSICIONES = {
  Pendiente: ['Asignada', 'Cancelada'],
  Asignada: ['Realizada', 'Cancelada'],
  Realizada: [],
  Cancelada: [],
};

const citaSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    asesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null, index: true },
    inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', required: true },
    fecha: { type: Date, required: true },
    horaInicio: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    horaFin: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    estado: { type: String, enum: ESTADOS, default: 'Pendiente', index: true },
  },
  { timestamps: true }
);

// Anti-duplicado: el mismo asesor no puede tener dos citas activas en el mismo slot.
citaSchema.index(
  { asesor: 1, fecha: 1, horaInicio: 1 },
  { unique: true, partialFilterExpression: { estado: { $in: ['Pendiente', 'Asignada'] }, asesor: { $type: 'objectId' } } }
);
// Anti-duplicado: el mismo cliente no puede agendar dos citas activas en el mismo slot.
citaSchema.index(
  { cliente: 1, fecha: 1, horaInicio: 1 },
  { unique: true, partialFilterExpression: { estado: { $in: ['Pendiente', 'Asignada'] } } }
);

module.exports = mongoose.model('Cita', citaSchema);
module.exports.ESTADOS = ESTADOS;
module.exports.TRANSICIONES = TRANSICIONES;
