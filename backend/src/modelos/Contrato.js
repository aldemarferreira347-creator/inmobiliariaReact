const mongoose = require('mongoose');

const ESTADOS = ['Vigente', 'Vencido', 'Rescindido'];

const contratoSchema = new mongoose.Schema(
  {
    // Un contrato por reserva confirmada - equivalente a uk_contrato_reserva del PHP original.
    reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true, unique: true },
    // Denormalizado desde reserva.inmueble al crear el contrato (el PHP original lo resolvia con
    // un JOIN reserva->inmueble); se necesita como campo directo para que
    // inmuebleServicio.tieneReservaOContratoActivo (Fase 2) pueda consultarlo sin un join.
    inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', required: true, index: true },
    numeroContrato: { type: String, required: true, unique: true, trim: true },
    fechaInicio: { type: Date, required: true },
    // null = arriendo indefinido - nunca se marca Vencido automaticamente (igual que el PHP original).
    fechaFin: { type: Date, default: null },
    valorMensual: { type: Number, required: true, min: 0 },
    archivoPdfPath: { type: String, default: null },
    estado: { type: String, enum: ESTADOS, default: 'Vigente', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contrato', contratoSchema);
module.exports.ESTADOS = ESTADOS;
