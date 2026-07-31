const mongoose = require('mongoose');

const ESTADOS = ['En proceso', 'Finalizada', 'Cancelada'];

const ventaSchema = new mongoose.Schema(
  {
    inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', required: true, index: true },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    asesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    precioVenta: { type: Number, required: true, min: 0 },
    fechaVenta: { type: Date, required: true },
    notaria: { type: String, trim: true },
    escrituraPdfPath: { type: String, default: null },
    estado: { type: String, enum: ESTADOS, default: 'En proceso', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venta', ventaSchema);
module.exports.ESTADOS = ESTADOS;
