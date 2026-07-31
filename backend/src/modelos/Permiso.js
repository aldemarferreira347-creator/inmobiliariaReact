const mongoose = require('mongoose');
const { TODOS_LOS_ROLES } = require('../utilidades/constantes');

const permisoSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, trim: true },
    modulo: { type: String, required: true, trim: true },
    accion: { type: String, required: true, enum: ['create', 'read', 'update', 'delete'] },
    descripcion: { type: String, required: true },
    rolesAsociados: [{ type: String, enum: TODOS_LOS_ROLES }],
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permiso', permisoSchema);
