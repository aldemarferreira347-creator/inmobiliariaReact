const asyncHandler = require('../utilidades/asyncHandler');
const ApiError = require('../utilidades/ApiError');
const mensajeServicio = require('../servicios/mensajeServicio');
const { ROLES } = require('../utilidades/constantes');

const enviar = asyncHandler(async (req, res) => {
  const { destinatarioId, contenido, adjuntoBase64 } = req.body;

  let mensajes;
  if (req.usuario.rol === ROLES.CLIENTE) {
    mensajes = await mensajeServicio.enviarComoCliente(req.usuario._id, { staffId: destinatarioId, contenido, adjuntoBase64 });
  } else {
    if (!destinatarioId) throw ApiError.badRequest('Debes indicar el cliente destinatario');
    mensajes = [await mensajeServicio.responder(req.usuario._id, { clienteId: destinatarioId, contenido, adjuntoBase64 })];
  }

  res.status(201).json({ exito: true, mensajes });
});

const conversaciones = asyncHandler(async (req, res) => {
  let lista;
  if (req.usuario.rol === ROLES.CLIENTE) {
    lista = await mensajeServicio.obtenerConversacionesPorCliente(req.usuario._id);
  } else if (req.usuario.rol === ROLES.ASESOR) {
    lista = await mensajeServicio.obtenerConversacionesPorAsesor(req.usuario._id);
  } else {
    lista = await mensajeServicio.obtenerConversacionesTodas();
  }
  res.json({ exito: true, conversaciones: lista });
});

function hiloParaUsuarioActual(req) {
  const otroId = req.params.otroId;
  return req.usuario.rol === ROLES.CLIENTE
    ? { clienteId: req.usuario._id, staffId: otroId }
    : { clienteId: otroId, staffId: req.usuario._id };
}

const hilo = asyncHandler(async (req, res) => {
  const { clienteId, staffId } = hiloParaUsuarioActual(req);
  const mensajes = await mensajeServicio.obtenerHilo(clienteId, staffId);
  res.json({ exito: true, mensajes });
});

const nuevosDesde = asyncHandler(async (req, res) => {
  const { clienteId, staffId } = hiloParaUsuarioActual(req);
  const mensajes = await mensajeServicio.obtenerNuevosDesde(clienteId, staffId, req.query.desde);
  res.json({ exito: true, mensajes });
});

const marcarLeidos = asyncHandler(async (req, res) => {
  const { clienteId, staffId } = hiloParaUsuarioActual(req);
  await mensajeServicio.marcarLeidos(clienteId, staffId, req.usuario._id);
  res.json({ exito: true });
});

const noLeidosCount = asyncHandler(async (req, res) => {
  const cantidad = await mensajeServicio.contarNoLeidos(req.usuario._id);
  res.json({ exito: true, cantidad });
});

module.exports = { enviar, conversaciones, hilo, nuevosDesde, marcarLeidos, noLeidosCount };
