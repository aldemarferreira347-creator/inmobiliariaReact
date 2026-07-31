const Notificacion = require('../modelos/Notificacion');
const Usuario = require('../modelos/Usuario');
const ApiError = require('../utilidades/ApiError');
const { ESTADOS_USUARIO } = require('../utilidades/constantes');

async function crear({ usuario, tipo = 'info', titulo, mensaje, entidadRelacionada }) {
  return Notificacion.create({ usuario, tipo, titulo, mensaje, entidadRelacionada });
}

async function crearParaVarios(usuarioIds, { tipo = 'info', titulo, mensaje, entidadRelacionada }) {
  const docs = usuarioIds.map((usuario) => ({ usuario, tipo, titulo, mensaje, entidadRelacionada }));
  return Notificacion.insertMany(docs);
}

async function obtenerPorUsuario(usuarioId, limite = 50) {
  return Notificacion.find({ usuario: usuarioId }).sort({ fecha: -1 }).limit(limite);
}

async function contarNoLeidas(usuarioId) {
  return Notificacion.countDocuments({ usuario: usuarioId, leida: false });
}

async function marcarLeida(notificacionId, usuarioId) {
  const notificacion = await Notificacion.findOne({ _id: notificacionId, usuario: usuarioId });
  if (!notificacion) throw ApiError.noEncontrado('Notificacion no encontrada');

  notificacion.leida = true;
  await notificacion.save();
  return notificacion;
}

async function marcarTodasLeidas(usuarioId) {
  await Notificacion.updateMany({ usuario: usuarioId, leida: false }, { leida: true });
}

// HU-22: envio manual desde el panel de administracion, individual o "a todos".
async function enviarBroadcast({ destino, usuarioId, titulo, mensaje }) {
  if (destino === 'individual') {
    if (!usuarioId) throw ApiError.badRequest('Debes indicar el usuario destinatario');
    return crear({ usuario: usuarioId, tipo: 'sistema', titulo, mensaje });
  }

  if (destino === 'todos') {
    const usuarios = await Usuario.find({ estado: ESTADOS_USUARIO.ACTIVO }).select('_id');
    return crearParaVarios(
      usuarios.map((u) => u._id),
      { tipo: 'sistema', titulo, mensaje }
    );
  }

  throw ApiError.badRequest('Destino invalido');
}

module.exports = {
  crear,
  crearParaVarios,
  obtenerPorUsuario,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  enviarBroadcast,
};
