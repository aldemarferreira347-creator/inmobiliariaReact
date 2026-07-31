const asyncHandler = require('../utilidades/asyncHandler');
const stripeTarjetaServicio = require('../servicios/stripeTarjetaServicio');

const setupIntent = asyncHandler(async (req, res) => {
  const resultado = await stripeTarjetaServicio.crearSetupIntent(req.usuario._id);
  res.json({ exito: true, ...resultado });
});

const guardar = asyncHandler(async (req, res) => {
  const tarjeta = await stripeTarjetaServicio.guardarTarjeta(req.usuario._id, req.body.paymentMethodId);
  res.status(201).json({ exito: true, tarjeta });
});

const listar = asyncHandler(async (req, res) => {
  const tarjetas = await stripeTarjetaServicio.listar(req.usuario._id);
  res.json({ exito: true, tarjetas });
});

const eliminar = asyncHandler(async (req, res) => {
  await stripeTarjetaServicio.eliminar(req.usuario._id, req.params.id);
  res.json({ exito: true });
});

module.exports = { setupIntent, guardar, listar, eliminar };
