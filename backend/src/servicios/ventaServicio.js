const mongoose = require('mongoose');
const Venta = require('../modelos/Venta');
const Inmueble = require('../modelos/Inmueble');
const Usuario = require('../modelos/Usuario');
const almacenamientoServicio = require('./almacenamientoServicio');
const notificacionServicio = require('./notificacionServicio');
const ApiError = require('../utilidades/ApiError');
const { ROLES } = require('../utilidades/constantes');

const ESTADOS_DESTINO_PERMITIDOS = ['Finalizada', 'Cancelada'];

// Igual que AsesorVentasController::formularioNuevo del PHP original: solo inmuebles Disponible en
// modalidad venta pueden iniciar un registro de venta.
async function obtenerInmueblesDisponiblesParaVenta() {
  return Inmueble.find({ estado: 'Disponible', modalidad: 'venta' }).sort({ titulo: 1 });
}

// El listado de usuarios (GET /api/usuarios) es solo-admin; el asesor necesita poder elegir un
// cliente al registrar una venta, asi que se expone este listado minimo aqui (mismo patron que
// citaServicio.obtenerAsesoresDisponibles).
async function obtenerClientesActivos() {
  return Usuario.find({ rol: ROLES.CLIENTE, estado: 'activo' }).select('nombre apellido correo').sort({ nombre: 1 });
}

// Anti-doble-venta: en el PHP original se usaba un SELECT ... FOR UPDATE + chequeo de estado
// dentro de una transaccion (mismo patron que ReservationService::iniciarReserva). Aqui se usa una
// transaccion real de Mongo con el mismo chequeo, mas atomica que el original porque tambien evita
// que la Venta quede creada sin que el inmueble haya cambiado de estado (o viceversa).
async function registrar(inmuebleId, clienteId, asesorId, { precioVenta, fechaVenta, notaria }) {
  const session = await mongoose.startSession();
  let ventaCreada;
  try {
    await session.withTransaction(async () => {
      const inmueble = await Inmueble.findById(inmuebleId).session(session);
      if (!inmueble) throw ApiError.noEncontrado('Inmueble no encontrado');
      if (inmueble.estado !== 'Disponible') {
        throw ApiError.conflicto('Solo se puede vender un inmueble Disponible');
      }

      inmueble.estado = 'Reservado';
      await inmueble.save({ session });

      [ventaCreada] = await Venta.create(
        [{ inmueble: inmuebleId, cliente: clienteId, asesor: asesorId, precioVenta, fechaVenta, notaria }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return ventaCreada;
}

async function subirEscritura(ventaId, archivo) {
  const venta = await Venta.findById(ventaId);
  if (!venta) throw ApiError.noEncontrado('Venta no encontrada');

  venta.escrituraPdfPath = await almacenamientoServicio.guardarEscrituraPdf(archivo, venta._id);
  await venta.save();
  return venta;
}

async function notificarVentaCancelada(venta) {
  await notificacionServicio.crear({
    usuario: venta.cliente,
    tipo: 'warning',
    titulo: 'Venta cancelada',
    mensaje: `La venta del inmueble fue cancelada.`,
    entidadRelacionada: { tipo: 'Venta', id: venta._id },
  });
}

// A diferencia del PHP original (que no validaba si la venta ya estaba en un estado terminal antes
// de cambiarla), aqui se agrega esa guarda: sin ella, cancelar una venta ya Finalizada/Cancelada
// podria revertir incorrectamente el inmueble a Disponible aunque ya hubiera sido re-reservado por
// otro flujo mientras tanto.
async function cambiarEstado(ventaId, nuevoEstado) {
  if (!ESTADOS_DESTINO_PERMITIDOS.includes(nuevoEstado)) {
    throw ApiError.badRequest('Estado destino invalido');
  }

  const session = await mongoose.startSession();
  let ventaFinal;
  try {
    await session.withTransaction(async () => {
      const venta = await Venta.findById(ventaId).session(session);
      if (!venta) throw ApiError.noEncontrado('Venta no encontrada');
      if (venta.estado !== 'En proceso') {
        throw ApiError.reglaDeNegocio(`No se puede cambiar el estado de una venta en estado ${venta.estado}`);
      }

      venta.estado = nuevoEstado;
      await venta.save({ session });

      await Inmueble.updateOne(
        { _id: venta.inmueble },
        { estado: nuevoEstado === 'Cancelada' ? 'Disponible' : 'Ocupado' },
        { session }
      );
      ventaFinal = venta;
    });
  } finally {
    await session.endSession();
  }

  if (nuevoEstado === 'Cancelada') {
    notificarVentaCancelada(ventaFinal).catch(() => {});
  }

  return ventaFinal;
}

async function listarTodas() {
  return Venta.find()
    .populate('inmueble', 'titulo codigo')
    .populate('cliente', 'nombre apellido')
    .populate('asesor', 'nombre apellido')
    .sort({ fechaVenta: -1 });
}

async function listarPorAsesor(asesorId) {
  return Venta.find({ asesor: asesorId })
    .populate('inmueble', 'titulo codigo')
    .populate('cliente', 'nombre apellido')
    .sort({ fechaVenta: -1 });
}

// HU-19.2: "Mis compras" del cliente.
async function listarPorCliente(clienteId) {
  return Venta.find({ cliente: clienteId })
    .populate('inmueble', 'titulo codigo')
    .populate('asesor', 'nombre apellido')
    .sort({ fechaVenta: -1 });
}

async function obtenerDetalle(id) {
  const venta = await Venta.findById(id)
    .populate('inmueble', 'titulo codigo')
    .populate('cliente', 'nombre apellido correo')
    .populate('asesor', 'nombre apellido');
  if (!venta) throw ApiError.noEncontrado('Venta no encontrada');
  return venta;
}

// A diferencia del PHP original (que no tenia un controlador de descarga seguro para escrituras,
// solo exponia la columna via la vista), aqui se aplica la misma proteccion que a los contratos:
// la escritura vive en storage/ (no en /uploads publico) y solo se sirve via esta ruta autenticada.
async function obtenerRutaArchivoParaUsuario(ventaId, usuario) {
  const venta = await Venta.findById(ventaId);
  if (!venta) throw ApiError.noEncontrado('Venta no encontrada');
  if (!venta.escrituraPdfPath) throw ApiError.noEncontrado('Esta venta aun no tiene una escritura cargada');

  const esAdmin = usuario.rol === ROLES.ADMINISTRADOR;
  const esAsesorPropietario = venta.asesor && String(venta.asesor) === String(usuario._id);
  const esClientePropietario = String(venta.cliente) === String(usuario._id);
  if (!esAdmin && !esAsesorPropietario && !esClientePropietario) {
    throw ApiError.prohibido('No tienes acceso a esta venta');
  }

  return venta.escrituraPdfPath;
}

module.exports = {
  obtenerInmueblesDisponiblesParaVenta,
  obtenerClientesActivos,
  registrar,
  subirEscritura,
  cambiarEstado,
  listarTodas,
  listarPorAsesor,
  listarPorCliente,
  obtenerDetalle,
  obtenerRutaArchivoParaUsuario,
};
