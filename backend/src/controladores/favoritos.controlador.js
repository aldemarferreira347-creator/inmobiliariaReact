const asyncHandler = require('../utilidades/asyncHandler');
const favoritoServicio = require('../servicios/favoritoServicio');

const listar = asyncHandler(async (req, res) => {
  const inmuebles = await favoritoServicio.listarPorCliente(req.usuario._id);
  res.json({ exito: true, inmuebles });
});

const alternar = asyncHandler(async (req, res) => {
  const resultado = await favoritoServicio.alternar(req.usuario._id, req.params.inmuebleId);
  res.json({ exito: true, ...resultado });
});

module.exports = { listar, alternar };
