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

// Formulario de contacto de la ficha publica de un inmueble (equivalente a
// InmuebleController::enviar_mensaje del PHP original). Solo clientes autenticados; el nombre/
// correo/telefono del formulario son informativos en el frontend, el mensaje siempre viaja con
// la identidad real del usuario autenticado.
const enviarContacto = asyncHandler(async (req, res) => {
  if (req.usuario.rol !== ROLES.CLIENTE) {
    throw ApiError.prohibido('Solo un cliente puede usar el formulario de contacto');
  }

  const { mensaje, inmuebleId } = req.body;
  const [mensajeCreado] = await mensajeServicio.enviarComoCliente(req.usuario._id, {
    contenido: mensaje,
    inmuebleId,
  });

  res.status(201).json({ exito: true, mensaje: mensajeCreado });
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
  if (req.usuario.rol === ROLES.CLIENTE) {
    return { clienteId: req.usuario._id, staffId: otroId };
  }
  if (req.usuario.rol === ROLES.ADMINISTRADOR && req.query.staffId) {
    return { clienteId: otroId, staffId: req.query.staffId };
  }
  return { clienteId: otroId, staffId: req.usuario._id };
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

module.exports = { enviar, enviarContacto, conversaciones, hilo, nuevosDesde, marcarLeidos, noLeidosCount };
