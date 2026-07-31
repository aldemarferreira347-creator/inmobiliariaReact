const asyncHandler = require('../utilidades/asyncHandler');
const notificacionServicio = require('../servicios/notificacionServicio');

const listar = asyncHandler(async (req, res) => {
  const notificaciones = await notificacionServicio.obtenerPorUsuario(req.usuario._id);
  res.json({ exito: true, notificaciones });
});

const contador = asyncHandler(async (req, res) => {
  const cantidad = await notificacionServicio.contarNoLeidas(req.usuario._id);
  res.json({ exito: true, cantidad });
});

const marcarUna = asyncHandler(async (req, res) => {
  const notificacion = await notificacionServicio.marcarLeida(req.params.id, req.usuario._id);
  res.json({ exito: true, notificacion });
});

const marcarTodas = asyncHandler(async (req, res) => {
  await notificacionServicio.marcarTodasLeidas(req.usuario._id);
  res.json({ exito: true });
});

const enviarBroadcast = asyncHandler(async (req, res) => {
  await notificacionServicio.enviarBroadcast(req.body);
  res.status(201).json({ exito: true, mensaje: 'Notificacion enviada correctamente' });
});

module.exports = { listar, contador, marcarUna, marcarTodas, enviarBroadcast };
