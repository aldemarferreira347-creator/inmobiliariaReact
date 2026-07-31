const mongoose = require('mongoose');

const favoritoSchema = new mongoose.Schema(
  {
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', required: true, index: true },
  },
  { timestamps: true }
);

favoritoSchema.index({ cliente: 1, inmueble: 1 }, { unique: true });

module.exports = mongoose.model('Favorito', favoritoSchema);
