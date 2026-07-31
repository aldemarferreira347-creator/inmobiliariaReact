const mongoose = require('mongoose');

const TIPOS = ['casa', 'apartamento', 'local', 'oficina', 'lote', 'bodega'];
const MODALIDADES = ['arriendo', 'venta'];
const ESTADOS = ['Disponible', 'Reservado', 'Ocupado'];

const ubicacionSchema = new mongoose.Schema(
  {
    direccion: { type: String, trim: true },
    ciudad: { type: String, required: true, trim: true },
    barrio: { type: String, trim: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const inmuebleSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, trim: true },
    titulo: { type: String, required: true, trim: true, maxlength: 150 },
    // Descripcion minima de 50 caracteres, igual que HU-08 del PHP original.
    descripcion: { type: String, required: true, minlength: 50 },
    tipo: { type: String, required: true, enum: TIPOS },
    modalidad: { type: String, required: true, enum: MODALIDADES },
    precio: { type: Number, required: true, min: 0 },
    habitaciones: { type: Number, min: 0, default: 0 },
    banos: { type: Number, min: 0, default: 0 },
    areaM2: { type: Number, min: 0 },
    parqueadero: { type: Boolean, default: false },
    ubicacion: { type: ubicacionSchema, required: true },
    estado: { type: String, enum: ESTADOS, default: 'Disponible', index: true },
    destacado: { type: Boolean, default: false },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechaPublicacion: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

inmuebleSchema.index({ estado: 1, tipo: 1, modalidad: 1 });
inmuebleSchema.index({ precio: 1 });
inmuebleSchema.index({ titulo: 'text', descripcion: 'text', 'ubicacion.ciudad': 'text', 'ubicacion.barrio': 'text' });

// Normaliza 'ambos' -> 'venta' igual que Inmueble::coherenciarModalidadPrecios del PHP original
// (el CHECK de la BD original no contemplaba 'ambos' como valor valido).
inmuebleSchema.pre('validate', function coherenciarModalidad() {
  if (this.modalidad === 'ambos') {
    this.modalidad = 'venta';
  }
});

module.exports = mongoose.model('Inmueble', inmuebleSchema);
module.exports.TIPOS = TIPOS;
module.exports.MODALIDADES = MODALIDADES;
module.exports.ESTADOS = ESTADOS;
