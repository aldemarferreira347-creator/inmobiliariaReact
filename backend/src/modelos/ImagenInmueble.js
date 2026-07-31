const mongoose = require('mongoose');

const imagenInmuebleSchema = new mongoose.Schema(
  {
    inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', required: true, index: true },
    rutaArchivo: { type: String, required: true },
    esPrincipal: { type: Boolean, default: false },
    orden: { type: Number, default: 0 },
    mimeType: { type: String },
    tamanoBytes: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ImagenInmueble', imagenInmuebleSchema);
