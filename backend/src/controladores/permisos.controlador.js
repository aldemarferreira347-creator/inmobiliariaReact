const asyncHandler = require('../utilidades/asyncHandler');
const Permiso = require('../modelos/Permiso');

const listar = asyncHandler(async (req, res) => {
  const permisos = await Permiso.find({ activo: true }).sort({ modulo: 1, accion: 1 });
  res.json({ exito: true, permisos });
});

module.exports = { listar };
