const mongoose = require('mongoose');
const ApiError = require('../utilidades/ApiError');

function minutosDesdeHHMM(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

const configFranjaCitaSchema = new mongoose.Schema(
  {
    // 0 = domingo ... 6 = sabado, igual convencion que Date.getDay()
    diaSemana: { type: Number, required: true, min: 0, max: 6, unique: true },
    horaInicio: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    horaFin: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    duracionSlotMinutos: { type: Number, default: 30, min: 5 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Replica chk_franja_horas del PHP original: la hora de fin debe ser posterior a la de inicio.
configFranjaCitaSchema.pre('validate', function validarHoras() {
  if (this.horaInicio && this.horaFin && minutosDesdeHHMM(this.horaFin) <= minutosDesdeHHMM(this.horaInicio)) {
    throw ApiError.badRequest('La hora de fin debe ser posterior a la hora de inicio');
  }
});

module.exports = mongoose.model('ConfigFranjaCita', configFranjaCitaSchema);
module.exports.minutosDesdeHHMM = minutosDesdeHHMM;
