const mongoose = require('mongoose');

const ESTADOS = ['PENDIENTE_PAGO', 'PROCESANDO_PAGO', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'EXPIRADA'];

// Estados que cuentan como "reserva activa" para un inmueble (bloquean nuevas reservas sobre el
// mismo inmueble) - igual que Reserva::tieneReservaActiva() del PHP original.
const ESTADOS_ACTIVOS = ['PENDIENTE_PAGO', 'PROCESANDO_PAGO', 'CONFIRMADA'];

const reservaSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, trim: true },
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', required: true },
    // Precio del inmueble al momento de reservar (snapshot server-side, nunca confiar en el cliente).
    monto: { type: Number, required: true, min: 0 },
    estado: { type: String, enum: ESTADOS, default: 'PENDIENTE_PAGO', index: true },
    fechaExpiracion: { type: Date, required: true },
    fechaConfirmacion: { type: Date, default: null },
    eliminado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Anti-doble-reserva (RN equivalente a Reserva::tieneReservaActiva + FOR UPDATE del PHP original):
// un inmueble no puede tener mas de una reserva en un estado activo a la vez. A diferencia del PHP
// (que solo usaba un lock pesimista de fila), aqui se refuerza tambien con este indice unico parcial
// a nivel de base de datos.
reservaSchema.index(
  { inmueble: 1 },
  { unique: true, partialFilterExpression: { estado: { $in: ESTADOS_ACTIVOS } } }
);
reservaSchema.index({ cliente: 1, estado: 1 });

module.exports = mongoose.model('Reserva', reservaSchema);
module.exports.ESTADOS = ESTADOS;
module.exports.ESTADOS_ACTIVOS = ESTADOS_ACTIVOS;
