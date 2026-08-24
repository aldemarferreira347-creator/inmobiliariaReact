const Mensaje = require('../modelos/Mensaje');
const Usuario = require('../modelos/Usuario');
const Inmueble = require('../modelos/Inmueble');
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

// Replica AsesorDeConversacionExistente del PHP original: si el cliente ya tiene un hilo previo
// con algun miembro del staff, se reutiliza ese mismo asesor para mantener continuidad.
async function obtenerStaffDeConversacionExistente(clienteId) {
  const ultimoMensaje = await Mensaje.findOne({ hiloId: new RegExp(`^${clienteId}_`) }).sort({ fechaEnvio: -1 });
  if (!ultimoMensaje) return null;
  const staffId = ultimoMensaje.hiloId.split('_')[1];
  return Usuario.findOne({ _id: staffId, estado: ESTADOS_USUARIO.ACTIVO });
}

async function elegirStaffDestino(clienteId, staffActivo) {
  const staffExistente = await obtenerStaffDeConversacionExistente(clienteId);
  if (staffExistente && staffActivo.some((s) => String(s._id) === String(staffExistente._id))) {
    return staffExistente;
  }
  return staffActivo[Math.floor(Math.random() * staffActivo.length)];
}

async function enviarComoCliente(clienteId, { staffId, contenido, adjuntoBase64, inmuebleId }) {
  if (!contenido?.trim() && !adjuntoBase64) {
    throw ApiError.badRequest('El mensaje no puede estar vacio');
  }

  let staff;
  if (staffId) {
    staff = await Usuario.findOne({ _id: staffId, estado: ESTADOS_USUARIO.ACTIVO });
    if (!staff || !esStaff(staff)) throw ApiError.badRequest('Destinatario invalido');
  } else {
    // Sin staff especifico (primer contacto, p.ej. formulario de la ficha del inmueble): se elige
    // un unico destinatario -reutilizando la conversacion existente o al azar-, igual que
    // InmuebleController::enviar_mensaje del PHP original (nunca se reparte a todo el staff).
    const staffActivo = await obtenerStaffActivo();
    if (staffActivo.length === 0) {
      throw ApiError.conflicto('No hay personal disponible para recibir mensajes en este momento');
    }
    staff = await elegirStaffDestino(clienteId, staffActivo);
  }

  const mensaje = await Mensaje.create({
    hiloId: construirHiloId(clienteId, staff._id),
    remitente: clienteId,
    destinatario: staff._id,
    inmueble: inmuebleId || null,
    contenido,
    adjuntoBase64,
  });

  let textoNotificacion = 'Tienes un nuevo mensaje de un cliente';
  if (inmuebleId) {
    const inmueble = await Inmueble.findById(inmuebleId).select('titulo');
    if (inmueble) textoNotificacion = `Tienes un nuevo mensaje de un cliente sobre "${inmueble.titulo}"`;
  }

  await notificacionServicio.crear({
    usuario: staff._id,
    tipo: 'info',
    titulo: 'Nuevo mensaje',
    mensaje: textoNotificacion,
    entidadRelacionada: { tipo: 'mensaje', id: mensaje._id },
  });

  return [mensaje];
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
