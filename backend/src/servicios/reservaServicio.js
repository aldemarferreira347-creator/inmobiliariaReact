const mongoose = require('mongoose');
const Reserva = require('../modelos/Reserva');
const HistorialReserva = require('../modelos/HistorialReserva');
const Inmueble = require('../modelos/Inmueble');
const Usuario = require('../modelos/Usuario');
const pagoServicio = require('./pagoServicio');
const notificacionServicio = require('./notificacionServicio');
const correoServicio = require('./correoServicio');
const ApiError = require('../utilidades/ApiError');
const logger = require('../utilidades/logger');
const { ROLES } = require('../utilidades/constantes');

const HORAS_EXPIRACION = 24;

async function generarCodigoUnico() {
  let codigo;
  let existe = true;
  do {
    codigo = `RES-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    existe = await Reserva.exists({ codigo });
  } while (existe);
  return codigo;
}

// RN-11: el inmueble permanece 'Disponible' al crear la reserva - solo cambia a 'Reservado' tras
// pago exitoso (ver aprobarPago). El anti-doble-reserva del PHP original (lock pesimista FOR UPDATE
// + conteo de reservas activas dentro de una transaccion) se reemplaza aqui por una transaccion
// real de Mongo (replica set) mas el indice unico parcial de Reserva (inmueble + estado activo).
async function iniciar(clienteId, inmuebleId) {
  const session = await mongoose.startSession();
  try {
    let reservaCreada;
    await session.withTransaction(async () => {
      const inmueble = await Inmueble.findById(inmuebleId).session(session);
      if (!inmueble) throw ApiError.noEncontrado('Inmueble no encontrado');
      if (inmueble.estado !== 'Disponible') {
        throw ApiError.conflicto('Este inmueble ya no esta disponible para reservar');
      }

      const codigo = await generarCodigoUnico();
      const fechaExpiracion = new Date(Date.now() + HORAS_EXPIRACION * 60 * 60 * 1000);

      try {
        const [reserva] = await Reserva.create(
          [{ codigo, cliente: clienteId, inmueble: inmuebleId, monto: inmueble.precio, fechaExpiracion }],
          { session }
        );
        await HistorialReserva.create(
          [
            {
              reserva: reserva._id,
              estadoAnterior: 'PENDIENTE_PAGO',
              estadoNuevo: 'PENDIENTE_PAGO',
              usuario: clienteId,
              motivo: 'Reserva creada',
            },
          ],
          { session }
        );
        reservaCreada = reserva;
      } catch (error) {
        if (error.code === 11000) {
          throw ApiError.conflicto('Este inmueble ya tiene una reserva en proceso');
        }
        throw error;
      }
    });
    return reservaCreada;
  } finally {
    await session.endSession();
  }
}

async function misReservas(clienteId) {
  return Reserva.find({ cliente: clienteId, eliminado: false })
    .populate('inmueble', 'titulo codigo precio modalidad')
    .sort({ createdAt: -1 });
}

async function listarTodas() {
  return Reserva.find({ eliminado: false })
    .populate('cliente', 'nombre apellido correo')
    .populate('inmueble', 'titulo codigo precio')
    .sort({ createdAt: -1 });
}

async function obtenerDetalle(reservaId) {
  const reserva = await Reserva.findOne({ _id: reservaId, eliminado: false })
    .populate('cliente', 'nombre apellido correo telefono')
    .populate('inmueble', 'titulo codigo precio modalidad');
  if (!reserva) throw ApiError.noEncontrado('Reserva no encontrada');

  const [pagos, historial] = await Promise.all([
    pagoServicio.obtenerPorReserva(reservaId),
    HistorialReserva.find({ reserva: reservaId }).sort({ fecha: 1 }),
  ]);

  return { reserva, pagos, historial };
}

// Valida la reserva y crea el registro local de Pago (PENDIENTE) que luego usa stripeServicio o
// stripeTarjetaServicio para iniciar el cobro - misma validacion que StripeService::crearSesionCheckout
// del PHP original (solo admite pago en PENDIENTE_PAGO o RECHAZADA, y solo si no ha expirado).
async function prepararPago(reservaId, clienteId, metodoPagoGuardadoId = null) {
  const reserva = await Reserva.findOne({ _id: reservaId, eliminado: false });
  if (!reserva) throw ApiError.noEncontrado('Reserva no encontrada');
  if (String(reserva.cliente) !== String(clienteId)) {
    throw ApiError.prohibido('No puedes pagar una reserva que no es tuya');
  }
  if (!['PENDIENTE_PAGO', 'RECHAZADA'].includes(reserva.estado)) {
    throw ApiError.reglaDeNegocio('Esta reserva no admite pago en su estado actual');
  }
  if (reserva.fechaExpiracion < new Date()) {
    throw ApiError.reglaDeNegocio('Esta reserva ya expiro');
  }

  const pago = await pagoServicio.crear({
    reserva: reserva._id,
    monto: reserva.monto,
    metodoPagoGuardado: metodoPagoGuardadoId,
  });
  return { reserva, pago };
}

async function cancelar(reservaId, usuarioId, esCliente) {
  const session = await mongoose.startSession();
  try {
    let reservaFinal;
    await session.withTransaction(async () => {
      const reserva = await Reserva.findOne({ _id: reservaId, eliminado: false }).session(session);
      if (!reserva) throw ApiError.noEncontrado('Reserva no encontrada');

      if (esCliente) {
        if (String(reserva.cliente) !== String(usuarioId)) {
          throw ApiError.prohibido('No puedes cancelar una reserva que no es tuya');
        }
        // El cliente solo puede cancelar mientras esta Pendiente de pago (igual que
        // ClienteReservasController::cancelar del PHP original).
        if (reserva.estado !== 'PENDIENTE_PAGO') {
          throw ApiError.reglaDeNegocio('Solo puedes cancelar una reserva pendiente de pago');
        }
      } else if (['CANCELADA', 'RECHAZADA', 'EXPIRADA'].includes(reserva.estado)) {
        throw ApiError.reglaDeNegocio(`No se puede cancelar una reserva en estado ${reserva.estado}`);
      }

      const estadoAnterior = reserva.estado;
      reserva.estado = 'CANCELADA';
      await reserva.save({ session });

      if (estadoAnterior === 'CONFIRMADA') {
        // Solo el admin puede llegar aqui (el cliente ya quedo bloqueado arriba). Revierte el
        // inmueble a Disponible para no dejarlo bloqueado en 'Reservado' sin ninguna reserva activa
        // (gap de estado no cubierto explicitamente en el PHP original).
        await Inmueble.updateOne({ _id: reserva.inmueble, estado: 'Reservado' }, { estado: 'Disponible' }, { session });
      }

      await HistorialReserva.create(
        [
          {
            reserva: reserva._id,
            estadoAnterior,
            estadoNuevo: 'CANCELADA',
            usuario: usuarioId,
            motivo: 'Reserva cancelada',
          },
        ],
        { session }
      );
      reservaFinal = reserva;
    });
    return reservaFinal;
  } finally {
    await session.endSession();
  }
}

async function notificarPagoConfirmado(reserva) {
  const [cliente, inmueble, staff] = await Promise.all([
    Usuario.findById(reserva.cliente),
    Inmueble.findById(reserva.inmueble),
    Usuario.find({ rol: { $in: [ROLES.ASESOR, ROLES.ADMINISTRADOR] }, estado: 'activo' }).select('_id'),
  ]);

  if (cliente) {
    await notificacionServicio.crear({
      usuario: cliente._id,
      tipo: 'success',
      titulo: 'Reserva confirmada',
      mensaje: `Tu reserva ${reserva.codigo} fue confirmada. El pago se proceso exitosamente.`,
      entidadRelacionada: { tipo: 'Reserva', id: reserva._id },
    });
    try {
      await correoServicio.enviarComprobantePago(cliente, reserva);
    } catch (error) {
      logger.error('Fallo enviando comprobante de pago', error);
    }
  }

  if (staff.length) {
    await notificacionServicio.crearParaVarios(
      staff.map((u) => u._id),
      {
        tipo: 'info',
        titulo: 'Inmueble reservado',
        mensaje: `El inmueble "${inmueble?.titulo || ''}" cambio a estado Reservado (reserva ${reserva.codigo} confirmada).`,
        entidadRelacionada: { tipo: 'Reserva', id: reserva._id },
      }
    );
  }
}

// Unico lugar donde reserva pasa a CONFIRMADA e inmueble a 'Reservado' (RN-11), en una sola
// transaccion - llamado desde el webhook de Stripe o de forma sincronica tras un PaymentIntent
// exitoso con tarjeta guardada. Idempotente: si la reserva ya esta CONFIRMADA no repite el efecto
// (un mismo pago puede confirmarse por dos caminos, ej. sincrono + webhook).
async function aprobarPago(reservaId) {
  const session = await mongoose.startSession();
  let reservaFinal;
  let yaConfirmada = false;
  try {
    await session.withTransaction(async () => {
      const reserva = await Reserva.findById(reservaId).session(session);
      if (!reserva) throw ApiError.noEncontrado('Reserva no encontrada');

      if (reserva.estado === 'CONFIRMADA') {
        yaConfirmada = true;
        reservaFinal = reserva;
        return;
      }

      const estadoAnterior = reserva.estado;
      reserva.estado = 'CONFIRMADA';
      reserva.fechaConfirmacion = new Date();
      await reserva.save({ session });

      await Inmueble.updateOne({ _id: reserva.inmueble }, { estado: 'Reservado' }, { session });

      await HistorialReserva.create(
        [
          {
            reserva: reserva._id,
            estadoAnterior,
            estadoNuevo: 'CONFIRMADA',
            usuario: null,
            motivo: 'Pago confirmado por Stripe',
          },
        ],
        { session }
      );
      reservaFinal = reserva;
    });
  } finally {
    await session.endSession();
  }

  if (!yaConfirmada) {
    notificarPagoConfirmado(reservaFinal).catch((error) => logger.error('Fallo notificando pago confirmado', error));
  }

  return reservaFinal;
}

// HU-23.2/23.3: un pago rechazado o una sesion de Stripe expirada NO cambian el estado de la
// reserva (permanece en Pendiente de pago para que el cliente pueda reintentar) - solo se audita
// en el historial, igual que PaymentService::rechazarPago del PHP original.
async function rechazarPago(reservaId, motivo) {
  const reserva = await Reserva.findById(reservaId);
  if (!reserva) return;

  await HistorialReserva.create({
    reserva: reserva._id,
    estadoAnterior: reserva.estado,
    estadoNuevo: reserva.estado,
    usuario: null,
    motivo,
  });
}

// CRON (ver tareasProgramadas/expirarReservas.js): expira las reservas Pendiente de pago cuya
// fechaExpiracion ya paso, revirtiendo el inmueble a Disponible - una transaccion por reserva,
// igual que scripts/cron_expirar.php del PHP original (un fallo en una no bloquea las demas).
async function expirarVencidas() {
  const vencidas = await Reserva.find({ estado: 'PENDIENTE_PAGO', fechaExpiracion: { $lt: new Date() }, eliminado: false });

  let total = 0;
  for (const reservaVencida of vencidas) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const actual = await Reserva.findById(reservaVencida._id).session(session);
        if (!actual || actual.estado !== 'PENDIENTE_PAGO') return;

        actual.estado = 'EXPIRADA';
        await actual.save({ session });

        await Inmueble.updateOne({ _id: actual.inmueble }, { estado: 'Disponible' }, { session });

        await HistorialReserva.create(
          [
            {
              reserva: actual._id,
              estadoAnterior: 'PENDIENTE_PAGO',
              estadoNuevo: 'EXPIRADA',
              usuario: null,
              motivo: 'Expirada automaticamente por el CRON de expiracion de reservas',
            },
          ],
          { session }
        );
      });
      total += 1;
    } catch (error) {
      logger.error(`Fallo expirando la reserva ${reservaVencida._id}`, error);
    } finally {
      await session.endSession();
    }
  }

  return total;
}

module.exports = {
  iniciar,
  misReservas,
  listarTodas,
  obtenerDetalle,
  prepararPago,
  cancelar,
  aprobarPago,
  rechazarPago,
  expirarVencidas,
};
