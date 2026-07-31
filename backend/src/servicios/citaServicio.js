const ConfigFranjaCita = require('../modelos/ConfigFranjaCita');
const Cita = require('../modelos/Cita');
const CitaHistorial = require('../modelos/CitaHistorial');
const ObservacionCita = require('../modelos/ObservacionCita');
const Usuario = require('../modelos/Usuario');
const ApiError = require('../utilidades/ApiError');
const { ROLES } = require('../utilidades/constantes');

const DIAS_MAXIMOS_ADELANTE = 30;

function sumarMinutos(hhmm, minutos) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const horas = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const mins = (total % 60).toString().padStart(2, '0');
  return `${horas}:${mins}`;
}

function generarSlotsDelDia(franja) {
  const slots = [];
  let actual = franja.horaInicio;
  while (actual < franja.horaFin) {
    const fin = sumarMinutos(actual, franja.duracionSlotMinutos);
    if (fin > franja.horaFin) break;
    slots.push({ horaInicio: actual, horaFin: fin });
    actual = fin;
  }
  return slots;
}

function inicioDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function franjasDisponibles(fechaStr) {
  const fecha = new Date(`${fechaStr}T00:00:00`);
  const hoy = inicioDelDia(new Date());
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + DIAS_MAXIMOS_ADELANTE);

  if (Number.isNaN(fecha.getTime()) || fecha < hoy || fecha > limite) {
    throw ApiError.badRequest(`La fecha debe estar entre hoy y los proximos ${DIAS_MAXIMOS_ADELANTE} dias`);
  }

  const diaSemana = fecha.getDay();
  const franja = await ConfigFranjaCita.findOne({ diaSemana, activo: true });
  if (!franja) {
    return { fecha: fechaStr, slots: [] };
  }

  const slots = generarSlotsDelDia(franja);

  const citasDelDia = await Cita.find({
    fecha: { $gte: inicioDelDia(fecha), $lte: finDelDia(fecha) },
    estado: { $in: ['Pendiente', 'Asignada'] },
  }).select('horaInicio');

  const horasOcupadas = new Set(citasDelDia.map((c) => c.horaInicio));

  return {
    fecha: fechaStr,
    slots: slots.map((slot) => ({ ...slot, disponible: !horasOcupadas.has(slot.horaInicio) })),
  };
}

async function solicitar(clienteId, { inmuebleId, fecha, horaInicio, horaFin }) {
  const disponibilidad = await franjasDisponibles(fecha);
  const slotValido = disponibilidad.slots.find((s) => s.horaInicio === horaInicio && s.horaFin === horaFin);
  if (!slotValido) {
    throw ApiError.badRequest('El horario seleccionado no es valido');
  }
  if (!slotValido.disponible) {
    throw ApiError.conflicto('El horario seleccionado ya no esta disponible');
  }

  const duplicada = await Cita.exists({
    cliente: clienteId,
    inmueble: inmuebleId,
    estado: { $in: ['Pendiente', 'Asignada'] },
  });
  if (duplicada) {
    throw ApiError.conflicto('Ya tienes una cita activa para este inmueble');
  }

  const cita = await Cita.create({
    cliente: clienteId,
    inmueble: inmuebleId,
    fecha: new Date(`${fecha}T00:00:00`),
    horaInicio,
    horaFin,
  });

  await CitaHistorial.create({ cita: cita._id, accion: 'creada', usuarioResponsable: clienteId });

  return cita;
}

async function misCitas(clienteId) {
  return Cita.find({ cliente: clienteId }).populate('inmueble', 'titulo codigo').populate('asesor', 'nombre apellido').sort({ fecha: -1 });
}

async function cancelar(citaId, usuarioId, esPropiaDeCliente) {
  const cita = await Cita.findById(citaId);
  if (!cita) throw ApiError.noEncontrado('Cita no encontrada');

  if (esPropiaDeCliente && String(cita.cliente) !== String(usuarioId)) {
    throw ApiError.prohibido('No puedes cancelar una cita que no es tuya');
  }
  if (!Cita.TRANSICIONES[cita.estado].includes('Cancelada')) {
    throw ApiError.reglaDeNegocio(`No se puede cancelar una cita en estado ${cita.estado}`);
  }

  cita.estado = 'Cancelada';
  await cita.save();
  await CitaHistorial.create({ cita: cita._id, accion: 'cancelada', usuarioResponsable: usuarioId });

  return cita;
}

async function obtenerCitasSinAsignar() {
  return Cita.find({ estado: 'Pendiente' }).populate('cliente', 'nombre apellido telefono').populate('inmueble', 'titulo codigo').sort({ fecha: 1 });
}

async function obtenerCitasAgrupadasPorAsesor() {
  const citas = await Cita.find({ estado: { $in: ['Asignada', 'Realizada'] } })
    .populate('asesor', 'nombre apellido')
    .populate('cliente', 'nombre apellido')
    .populate('inmueble', 'titulo codigo')
    .sort({ fecha: 1 });

  const agrupadas = new Map();
  for (const cita of citas) {
    const clave = cita.asesor ? String(cita.asesor._id) : 'sin-asignar';
    if (!agrupadas.has(clave)) agrupadas.set(clave, { asesor: cita.asesor, citas: [] });
    agrupadas.get(clave).citas.push(cita);
  }
  return Array.from(agrupadas.values());
}

async function obtenerAsesoresDisponibles() {
  // RN-14: solo asesores activos (estado global activo Y disponibilidad para asignacion).
  return Usuario.find({ rol: ROLES.ASESOR, estado: 'activo', 'perfilAsesor.activoParaAsignacion': true }).select(
    'nombre apellido'
  );
}

async function asignar(citaId, asesorId, usuarioQueEjecuta) {
  const cita = await Cita.findById(citaId);
  if (!cita) throw ApiError.noEncontrado('Cita no encontrada');

  const asesor = await Usuario.findOne({ _id: asesorId, rol: ROLES.ASESOR });
  if (!asesor) throw ApiError.badRequest('Asesor invalido');
  if (asesor.estado !== 'activo' || asesor.perfilAsesor?.activoParaAsignacion !== true) {
    throw ApiError.reglaDeNegocio('El asesor no esta disponible para recibir nuevas citas');
  }

  const esReasignacion = Boolean(cita.asesor);
  if (!esReasignacion && !Cita.TRANSICIONES[cita.estado].includes('Asignada')) {
    throw ApiError.reglaDeNegocio(`No se puede asignar una cita en estado ${cita.estado}`);
  }

  cita.asesor = asesor._id;
  cita.estado = 'Asignada';
  await cita.save();

  await CitaHistorial.create({
    cita: cita._id,
    accion: esReasignacion ? 'reasignada' : 'asignada',
    usuarioResponsable: usuarioQueEjecuta._id,
    detalle: `Asignada a ${asesor.nombre} ${asesor.apellido}`,
  });

  return cita;
}

async function obtenerCitasDeAsesor(asesorId, estado) {
  const filtro = { asesor: asesorId };
  if (estado) filtro.estado = estado;
  return Cita.find(filtro).populate('cliente', 'nombre apellido telefono').populate('inmueble', 'titulo codigo').sort({ fecha: 1 });
}

async function obtenerDetalleCompleto(citaId) {
  const cita = await Cita.findById(citaId)
    .populate('cliente', 'nombre apellido telefono correo')
    .populate('asesor', 'nombre apellido')
    .populate('inmueble', 'titulo codigo');
  if (!cita) throw ApiError.noEncontrado('Cita no encontrada');

  const [observacion, historial] = await Promise.all([
    ObservacionCita.findOne({ cita: citaId }),
    CitaHistorial.find({ cita: citaId }).sort({ fecha: 1 }),
  ]);

  return { cita, observacion, historial };
}

async function registrarObservacion(citaId, asesorId, contenido) {
  const cita = await Cita.findById(citaId);
  if (!cita) throw ApiError.noEncontrado('Cita no encontrada');
  if (String(cita.asesor) !== String(asesorId)) {
    throw ApiError.prohibido('No puedes registrar observaciones de una cita que no tienes asignada');
  }
  if (cita.estado !== 'Asignada') {
    throw ApiError.reglaDeNegocio('Solo se puede registrar observacion de una cita Asignada');
  }
  if (!contenido || !contenido.trim()) {
    throw ApiError.badRequest('La observacion no puede estar vacia');
  }

  const observacion = await ObservacionCita.findOneAndUpdate(
    { cita: citaId },
    { asesor: asesorId, contenido: contenido.trim() },
    { upsert: true, new: true }
  );

  cita.estado = 'Realizada';
  await cita.save();
  await CitaHistorial.create({ cita: cita._id, accion: 'realizada', usuarioResponsable: asesorId });

  return { cita, observacion };
}

module.exports = {
  franjasDisponibles,
  solicitar,
  misCitas,
  cancelar,
  obtenerCitasSinAsignar,
  obtenerCitasAgrupadasPorAsesor,
  obtenerAsesoresDisponibles,
  asignar,
  obtenerCitasDeAsesor,
  obtenerDetalleCompleto,
  registrarObservacion,
};
