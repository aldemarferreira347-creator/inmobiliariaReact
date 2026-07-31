const mongoose = require('mongoose');

const observacionCitaSchema = new mongoose.Schema(
  {
    cita: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita', required: true, unique: true },
    asesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    contenido: { type: String, required: true, trim: true, minlength: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ObservacionCita', observacionCitaSchema);
