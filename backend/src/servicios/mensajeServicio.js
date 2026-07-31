const Mensaje = require('../modelos/Mensaje');
const Usuario = require('../modelos/Usuario');
const ApiError = require('../utilidades/ApiError');
const notificacionServicio = require('./notificacionServicio');
const { ROLES, ESTADOS_USUARIO } = require('../utilidades/constantes');

function construirHiloId(clienteId, staffId) {
  return `${clienteId}_${staffId}`;
}

function esStaff(usuario) {
  return usuario.rol === ROLES.ASESOR || usuario.rol === ROLES.ADMINISTRADOR;
}

async function obtenerStaffActivo() {
  return Usuario.find({ rol: { $in: [ROLES.ASESOR, ROLES.ADMINISTRADOR] }, estado: ESTADOS_USUARIO.ACTIVO });
}

async function enviarComoCliente(clienteId, { staffId, contenido, adjuntoBase64 }) {
  if (!contenido?.trim() && !adjuntoBase64) {
    throw ApiError.badRequest('El mensaje no puede estar vacio');
  }

  if (staffId) {
    const staff = await Usuario.findOne({ _id: staffId, estado: ESTADOS_USUARIO.ACTIVO });
    if (!staff || !esStaff(staff)) throw ApiError.badRequest('Destinatario invalido');

    const mensaje = await Mensaje.create({
      hiloId: construirHiloId(clienteId, staffId),
      remitente: clienteId,
      destinatario: staffId,
      contenido,
      adjuntoBase64,
    });

    await notificacionServicio.crear({
      usuario: staffId,
      tipo: 'info',
      titulo: 'Nuevo mensaje',
      mensaje: 'Tienes un nuevo mensaje de un cliente',
      entidadRelacionada: { tipo: 'mensaje', id: mensaje._id },
    });

    return [mensaje];
  }

  // Sin staff especifico (primer contacto): se envia una copia a cada miembro activo del staff,
  // igual que Mensaje::enviarATodos del PHP original.
  const staffActivo = await obtenerStaffActivo();
  if (staffActivo.length === 0) {
    throw ApiError.conflicto('No hay personal disponible para recibir mensajes en este momento');
  }

  const mensajes = await Mensaje.insertMany(
    staffActivo.map((staff) => ({
      hiloId: construirHiloId(clienteId, staff._id),
      remitente: clienteId,
      destinatario: staff._id,
      contenido,
      adjuntoBase64,
    }))
  );

  await notificacionServicio.crearParaVarios(
    staffActivo.map((s) => s._id),
    { tipo: 'info', titulo: 'Nuevo mensaje', mensaje: 'Tienes un nuevo mensaje de un cliente' }
  );

  return mensajes;
}

async function responder(staffId, { clienteId, contenido, adjuntoBase64 }) {
  if (!contenido?.trim() && !adjuntoBase64) {
    throw ApiError.badRequest('El mensaje no puede estar vacio');
  }

  const cliente = await Usuario.findOne({ _id: clienteId, rol: ROLES.CLIENTE });
  if (!cliente) throw ApiError.noEncontrado('Cliente no encontrado');

  const mensaje = await Mensaje.create({
    hiloId: construirHiloId(clienteId, staffId),
    remitente: staffId,
    destinatario: clienteId,
    contenido,
    adjuntoBase64,
  });

  await notificacionServicio.crear({
    usuario: clienteId,
    tipo: 'info',
    titulo: 'Nuevo mensaje',
    mensaje: 'Un asesor respondio tu mensaje',
    entidadRelacionada: { tipo: 'mensaje', id: mensaje._id },
  });

  return mensaje;
}

async function obtenerHilo(clienteId, staffId) {
  return Mensaje.find({ hiloId: construirHiloId(clienteId, staffId) }).sort({ fechaEnvio: 1 });
}

async function obtenerNuevosDesde(clienteId, staffId, desde) {
  return Mensaje.find({
    hiloId: construirHiloId(clienteId, staffId),
    fechaEnvio: { $gt: new Date(desde) },
  }).sort({ fechaEnvio: 1 });
}

async function marcarLeidos(clienteId, staffId, usuarioQueLee) {
  await Mensaje.updateMany(
    { hiloId: construirHiloId(clienteId, staffId), destinatario: usuarioQueLee, leido: false },
    { leido: true }
  );
}

async function contarNoLeidos(usuarioId) {
  return Mensaje.countDocuments({ destinatario: usuarioId, leido: false });
}

// Agrupa los mensajes por hilo (par cliente-staff) para mostrar la bandeja de conversaciones.
async function agruparConversaciones(filtroMongo, usuarioActualId) {
  const mensajes = await Mensaje.find(filtroMongo).sort({ fechaEnvio: 1 });

  const hilos = new Map();
  for (const mensaje of mensajes) {
    if (!hilos.has(mensaje.hiloId)) hilos.set(mensaje.hiloId, []);
    hilos.get(mensaje.hiloId).push(mensaje);
  }

  const idsUsuarios = new Set();
  for (const hiloId of hilos.keys()) {
    const [clienteId, staffId] = hiloId.split('_');
    idsUsuarios.add(clienteId);
    idsUsuarios.add(staffId);
  }
  const usuarios = await Usuario.find({ _id: { $in: Array.from(idsUsuarios) } }).select('nombre apellido rol');
  const mapaUsuarios = new Map(usuarios.map((u) => [String(u._id), u]));

  return Array.from(hilos.entries()).map(([hiloId, lista]) => {
    const [clienteId, staffId] = hiloId.split('_');
    const ultimoMensaje = lista[lista.length - 1];
    const noLeidos = usuarioActualId
      ? lista.filter((m) => String(m.destinatario) === String(usuarioActualId) && !m.leido).length
      : 0;

    return {
      hiloId,
      cliente: mapaUsuarios.get(clienteId) || null,
      staff: mapaUsuarios.get(staffId) || null,
      ultimoMensaje,
      noLeidos,
    };
  }).sort((a, b) => new Date(b.ultimoMensaje.fechaEnvio) - new Date(a.ultimoMensaje.fechaEnvio));
}

async function obtenerConversacionesPorCliente(clienteId) {
  return agruparConversaciones({ hiloId: new RegExp(`^${clienteId}_`) }, clienteId);
}

async function obtenerConversacionesPorAsesor(asesorId) {
  return agruparConversaciones({ hiloId: new RegExp(`_${asesorId}$`) }, asesorId);
}

async function obtenerConversacionesTodas() {
  return agruparConversaciones({}, null);
}

module.exports = {
  construirHiloId,
  esStaff,
  obtenerStaffActivo,
  enviarComoCliente,
  responder,
  obtenerHilo,
  obtenerNuevosDesde,
  marcarLeidos,
  contarNoLeidos,
  obtenerConversacionesPorCliente,
  obtenerConversacionesPorAsesor,
  obtenerConversacionesTodas,
};
