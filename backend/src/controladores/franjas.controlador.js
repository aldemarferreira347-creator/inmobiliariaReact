const asyncHandler = require('../utilidades/asyncHandler');
const franjaServicio = require('../servicios/franjaServicio');

const listar = asyncHandler(async (req, res) => {
  const franjas = await franjaServicio.listar();
  res.json({ exito: true, franjas });
});

const guardar = asyncHandler(async (req, res) => {
  const franja = await franjaServicio.guardar(req.body);
  res.json({ exito: true, franja });
});

module.exports = { listar, guardar };
