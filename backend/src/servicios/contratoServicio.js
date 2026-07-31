const mongoose = require('mongoose');
const Contrato = require('../modelos/Contrato');
const Reserva = require('../modelos/Reserva');
const Inmueble = require('../modelos/Inmueble');
const Usuario = require('../modelos/Usuario');
const almacenamientoServicio = require('./almacenamientoServicio');
const notificacionServicio = require('./notificacionServicio');
const ApiError = require('../utilidades/ApiError');
const logger = require('../utilidades/logger');
const { ROLES } = require('../utilidades/constantes');

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

async function generarNumeroUnico() {
  const anio = new Date().getFullYear();
  let numero;
  let existe = true;
  do {
    numero = `CON-${anio}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    existe = await Contrato.exists({ numeroContrato: numero });
  } while (existe);
  return numero;
}

// Equivalente a Reserva::obtenerConfirmadasSinContrato del PHP original (LEFT JOIN + WHERE
// contrato.id IS NULL) - reservas confirmadas que aun no tienen un contrato asociado.
async function obtenerReservasConfirmadasSinContrato() {
  const reservas = await Reserva.find({ estado: 'CONFIRMADA', eliminado: false })
    .populate('cliente', 'nombre apellido')
    .populate('inmueble', 'titulo codigo')
    .sort({ fechaConfirmacion: -1 });

  const contratos = await Contrato.find({ reserva: { $in: reservas.map((r) => r._id) } }).select('reserva');
  const conContrato = new Set(contratos.map((c) => String(c.reserva)));

  return reservas.filter((r) => !conContrato.has(String(r._id)));
}

async function notificarContratoCreado(contrato, reserva) {
  const [cliente, inmueble, staff] = await Promise.all([
    Usuario.findById(reserva.cliente),
    Inmueble.findById(reserva.inmueble),
    Usuario.find({ rol: { $in: [ROLES.ASESOR, ROLES.ADMINISTRADOR] }, estado: 'activo' }).select('_id'),
  ]);

  if (cliente) {
    await notificacionServicio.crear({
      usuario: cliente._id,
      tipo: 'success',
      titulo: 'Contrato emitido',
      mensaje: `Se emitio el contrato ${contrato.numeroContrato} para tu reserva ${reserva.codigo}.`,
      entidadRelacionada: { tipo: 'Contrato', id: contrato._id },
    });
  }

  if (staff.length) {
    await notificacionServicio.crearParaVarios(
      staff.map((u) => u._id),
      {
        tipo: 'info',
        titulo: 'Inmueble ocupado',
        mensaje: `El inmueble "${inmueble?.titulo || ''}" cambio a estado Ocupado (contrato ${contrato.numeroContrato} emitido).`,
        entidadRelacionada: { tipo: 'Contrato', id: contrato._id },
      }
    );
  }
}

// RN-18: el contrato debe emitirse dentro de los 7 dias naturales posteriores a la confirmacion
// de la reserva - igual que ContratoService::crearDesdeReserva del PHP original (que derivaba la
// fecha de confirmacion del historial; aqui se usa reserva.fechaConfirmacion, guardada
// directamente en Fase 5). Fuera de la ventana, la creacion se bloquea sin excepcion.
async function crearDesdeReserva(reservaId, { fechaInicio, fechaFin, valorMensual }) {
  const reserva = await Reserva.findById(reservaId);
  if (!reserva) throw ApiError.noEncontrado('Reserva no encontrada');
  if (reserva.estado !== 'CONFIRMADA') {
    throw ApiError.reglaDeNegocio('Solo se puede emitir un contrato para una reserva confirmada');
  }

  if (reserva.fechaConfirmacion) {
    const limite = new Date(reserva.fechaConfirmacion.getTime() + SIETE_DIAS_MS);
    if (new Date() > limite) {
      throw ApiError.reglaDeNegocio(
        'No se puede emitir el contrato: han pasado mas de 7 dias desde que la reserva fue confirmada'
      );
    }
  }

  const fechaInicioDate = new Date(fechaInicio);
  const fechaFinDate = fechaFin ? new Date(fechaFin) : null;
  if (fechaFinDate && fechaFinDate <= fechaInicioDate) {
    throw ApiError.badRequest('La fecha de fin debe ser posterior a la fecha de inicio');
  }

  const numeroContrato = await generarNumeroUnico();

  const session = await mongoose.startSession();
  let contratoCreado;
  try {
    await session.withTransaction(async () => {
      try {
        [contratoCreado] = await Contrato.create(
          [
            {
              reserva: reserva._id,
              inmueble: reserva.inmueble,
              numeroContrato,
              fechaInicio: fechaInicioDate,
              fechaFin: fechaFinDate,
              valorMensual,
            },
          ],
          { session }
        );
      } catch (error) {
        if (error.code === 11000) {
          throw ApiError.conflicto('Ya existe un contrato para esta reserva');
        }
        throw error;
      }

      await Inmueble.updateOne({ _id: reserva.inmueble }, { estado: 'Ocupado' }, { session });
    });
  } finally {
    await session.endSession();
  }

  notificarContratoCreado(contratoCreado, reserva).catch((error) => logger.error('Fallo notificando contrato creado', error));

  return contratoCreado;
}

async function subirArchivo(contratoId, archivo) {
  const contrato = await Contrato.findById(contratoId);
  if (!contrato) throw ApiError.noEncontrado('Contrato no encontrado');

  contrato.archivoPdfPath = await almacenamientoServicio.guardarContratoPdf(archivo, contrato._id);
  await contrato.save();
  return contrato;
}

async function notificarContratoRescindido(contrato) {
  const reserva = await Reserva.findById(contrato.reserva);
  if (!reserva) return;

  await notificacionServicio.crear({
    usuario: reserva.cliente,
    tipo: 'warning',
    titulo: 'Contrato rescindido',
    mensaje: `El contrato ${contrato.numeroContrato} fue rescindido.`,
    entidadRelacionada: { tipo: 'Contrato', id: contrato._id },
  });
}

async function rescindir(contratoId) {
  const session = await mongoose.startSession();
  let contratoFinal;
  try {
    await session.withTransaction(async () => {
      const contrato = await Contrato.findById(contratoId).session(session);
      if (!contrato) throw ApiError.noEncontrado('Contrato no encontrado');
      if (contrato.estado !== 'Vigente') {
        throw ApiError.reglaDeNegocio('Solo se puede rescindir un contrato Vigente');
      }

      contrato.estado = 'Rescindido';
      await contrato.save({ session });

      await Inmueble.updateOne({ _id: contrato.inmueble }, { estado: 'Disponible' }, { session });
      contratoFinal = contrato;
    });
  } finally {
    await session.endSession();
  }

  notificarContratoRescindido(contratoFinal).catch((error) => logger.error('Fallo notificando contrato rescindido', error));
  return contratoFinal;
}

// HU-17.3: CRON que marca Vencido cualquier contrato Vigente cuya fechaFin ya paso (los de
// fechaFin=null son arriendos indefinidos y nunca vencen solos). Igual que
// ContratoService::marcarVencidos del PHP original: sin transaccion (una sola escritura por
// contrato) y sin tocar inmueble.estado - un contrato vencido no libera el inmueble
// automaticamente, requiere accion manual del admin (rescindir o renovar). Se agrega un try/catch
// por contrato (mejora de resiliencia respecto al PHP: un fallo no aborta el resto del lote).
async function marcarVencidos() {
  const vencidos = await Contrato.find({ estado: 'Vigente', fechaFin: { $ne: null, $lt: new Date() } });

  const staff = await Usuario.find({ rol: { $in: [ROLES.ASESOR, ROLES.ADMINISTRADOR] }, estado: 'activo' }).select('_id');

  let total = 0;
  for (const contrato of vencidos) {
    try {
      contrato.estado = 'Vencido';
      await contrato.save();
      total += 1;

      if (staff.length) {
        await notificacionServicio.crearParaVarios(
          staff.map((u) => u._id),
          {
            tipo: 'warning',
            titulo: 'Contrato vencido',
            mensaje: `El contrato ${contrato.numeroContrato} vencio automaticamente.`,
            entidadRelacionada: { tipo: 'Contrato', id: contrato._id },
          }
        );
      }
    } catch (error) {
      logger.error(`Fallo marcando como vencido el contrato ${contrato._id}`, error);
    }
  }

  return total;
}

async function listar() {
  return Contrato.find()
    .populate('inmueble', 'titulo codigo')
    .populate({ path: 'reserva', populate: { path: 'cliente', select: 'nombre apellido' } })
    .sort({ createdAt: -1 });
}

async function obtenerDetalle(id) {
  const contrato = await Contrato.findById(id)
    .populate('inmueble', 'titulo codigo')
    .populate({ path: 'reserva', populate: { path: 'cliente', select: 'nombre apellido correo' } });
  if (!contrato) throw ApiError.noEncontrado('Contrato no encontrado');
  return contrato;
}

// HU-19.1/19.4: "Mis arriendos" - toda reserva CONFIRMADA del cliente, con o sin contrato todavia
// (estadoVisible = 'Contrato pendiente' mientras no exista, igual que v_historial_arriendos).
async function obtenerHistorialArriendosCliente(clienteId) {
  const reservas = await Reserva.find({ cliente: clienteId, estado: 'CONFIRMADA', eliminado: false })
    .populate('inmueble', 'titulo codigo')
    .sort({ createdAt: -1 });

  const contratos = await Contrato.find({ reserva: { $in: reservas.map((r) => r._id) } });
  const porReserva = new Map(contratos.map((c) => [String(c.reserva), c]));

  return reservas.map((reserva) => {
    const contrato = porReserva.get(String(reserva._id)) || null;
    return { reserva, contrato, estadoVisible: contrato ? contrato.estado : 'Contrato pendiente' };
  });
}

async function obtenerRutaArchivoParaUsuario(contratoId, usuario) {
  const contrato = await Contrato.findById(contratoId).populate('reserva');
  if (!contrato) throw ApiError.noEncontrado('Contrato no encontrado');
  if (!contrato.archivoPdfPath) throw ApiError.noEncontrado('Este contrato aun no tiene un PDF cargado');

  const esAdmin = usuario.rol === ROLES.ADMINISTRADOR;
  const esPropietario = String(contrato.reserva.cliente) === String(usuario._id);
  if (!esAdmin && !esPropietario) {
    throw ApiError.prohibido('No tienes acceso a este contrato');
  }

  return contrato.archivoPdfPath;
}

module.exports = {
  obtenerReservasConfirmadasSinContrato,
  crearDesdeReserva,
  subirArchivo,
  rescindir,
  marcarVencidos,
  listar,
  obtenerDetalle,
  obtenerHistorialArriendosCliente,
  obtenerRutaArchivoParaUsuario,
};
