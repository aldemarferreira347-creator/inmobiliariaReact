const Inmueble = require('../modelos/Inmueble');
const Usuario = require('../modelos/Usuario');
const Reserva = require('../modelos/Reserva');
const Pago = require('../modelos/Pago');
const Contrato = require('../modelos/Contrato');
const Venta = require('../modelos/Venta');
const { ROLES } = require('../utilidades/constantes');

const LIMITE_LISTADO = 200;

// Igual que ReporteController::recopilarDatos del PHP original: un solo reporte consolidado con
// varias secciones, no reportes separados por tipo. "periodo" controla las metricas de tendencia
// (nuevos clientes, inmuebles publicados); fechaInicio/fechaFin (si se explicitan) filtran ademas
// los listados detallados de reservas/pagos/ventas.
function calcularRangoPeriodo(periodo) {
  const hasta = new Date();
  const desde = new Date(hasta);
  if (periodo === 'semana') desde.setDate(desde.getDate() - 7);
  else if (periodo === 'anio' || periodo === 'año') desde.setDate(desde.getDate() - 365);
  else desde.setDate(desde.getDate() - 30); // 'mes' (default)
  return { desde, hasta };
}

function rangoFechasExplicito(fechaInicio, fechaFin, porDefecto) {
  if (!fechaInicio && !fechaFin) return porDefecto;
  return {
    desde: fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : porDefecto.desde,
    hasta: fechaFin ? new Date(`${fechaFin}T23:59:59.999`) : porDefecto.hasta,
  };
}

async function resumenInmuebles(rangoPeriodo, filtros) {
  const filtroBase = {};
  if (filtros.tipo) filtroBase.tipo = filtros.tipo;
  if (filtros.ciudad) filtroBase['ubicacion.ciudad'] = new RegExp(filtros.ciudad, 'i');

  const [total, disponibles, publicadosEnPeriodo, porTipo, porEstado, porModalidad] = await Promise.all([
    Inmueble.countDocuments(filtroBase),
    Inmueble.countDocuments({ ...filtroBase, estado: 'Disponible' }),
    Inmueble.countDocuments({ ...filtroBase, fechaPublicacion: { $gte: rangoPeriodo.desde, $lte: rangoPeriodo.hasta } }),
    Inmueble.aggregate([{ $match: filtroBase }, { $group: { _id: '$tipo', total: { $sum: 1 } } }]),
    Inmueble.aggregate([{ $match: filtroBase }, { $group: { _id: '$estado', total: { $sum: 1 } } }]),
    Inmueble.aggregate([{ $match: filtroBase }, { $group: { _id: '$modalidad', total: { $sum: 1 } } }]),
  ]);

  return {
    total,
    disponibles,
    publicadosEnPeriodo,
    porTipo: porTipo.map((t) => ({ tipo: t._id, total: t.total })),
    porEstado: porEstado.map((t) => ({ estado: t._id, total: t.total })),
    porModalidad: porModalidad.map((t) => ({ modalidad: t._id, total: t.total })),
  };
}

// HU-6.1: listado detallado de reservaciones (codigo, fecha, inmueble, cliente, monto, estado).
async function resumenReservas(rangoListado, filtros) {
  const filtroListado = { eliminado: false, createdAt: { $gte: rangoListado.desde, $lte: rangoListado.hasta } };
  if (filtros.estado) filtroListado.estado = filtros.estado;

  const [total, confirmadas, pendientes, canceladas, porEstado, listadoDocs] = await Promise.all([
    Reserva.countDocuments({ eliminado: false }),
    Reserva.countDocuments({ eliminado: false, estado: 'CONFIRMADA' }),
    Reserva.countDocuments({ eliminado: false, estado: 'PENDIENTE_PAGO' }),
    Reserva.countDocuments({ eliminado: false, estado: 'CANCELADA' }),
    Reserva.aggregate([{ $match: { eliminado: false } }, { $group: { _id: '$estado', total: { $sum: 1 } } }]),
    Reserva.find(filtroListado)
      .populate('cliente', 'nombre apellido')
      .populate('inmueble', 'titulo')
      .sort({ createdAt: -1 })
      .limit(LIMITE_LISTADO),
  ]);

  return {
    total,
    confirmadas,
    pendientes,
    canceladas,
    porEstado: porEstado.map((r) => ({ estado: r._id, total: r.total })),
    listado: listadoDocs.map((r) => ({
      codigo: r.codigo,
      fecha: r.createdAt,
      inmueble: r.inmueble?.titulo || '',
      cliente: r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : '',
      monto: r.monto,
      estado: r.estado,
    })),
  };
}

async function resumenClientes(rangoPeriodo) {
  const [total, nuevosEnPeriodo, conReservasActivasIds, masActivos] = await Promise.all([
    Usuario.countDocuments({ rol: ROLES.CLIENTE }),
    Usuario.countDocuments({ rol: ROLES.CLIENTE, createdAt: { $gte: rangoPeriodo.desde, $lte: rangoPeriodo.hasta } }),
    Reserva.distinct('cliente', { estado: { $in: ['PENDIENTE_PAGO', 'PROCESANDO_PAGO', 'CONFIRMADA'] }, eliminado: false }),
    Reserva.aggregate([
      { $match: { eliminado: false } },
      { $group: { _id: '$cliente', totalReservas: { $sum: 1 } } },
      { $sort: { totalReservas: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
      { $unwind: '$usuario' },
      { $project: { nombre: '$usuario.nombre', apellido: '$usuario.apellido', correo: '$usuario.correo', totalReservas: 1 } },
    ]),
  ]);

  return {
    total,
    nuevosEnPeriodo,
    conReservasActivas: conReservasActivasIds.length,
    masActivos: masActivos.map((c) => ({ nombre: `${c.nombre} ${c.apellido}`, correo: c.correo, totalReservas: c.totalReservas })),
  };
}

async function resumenFinanciero(rangoListado) {
  const [totalPagadoAgg, totalVentas, arriendosAgg, pagosRechazados] = await Promise.all([
    Pago.aggregate([{ $match: { estado: 'PAGADO' } }, { $group: { _id: null, total: { $sum: '$monto' } } }]),
    Venta.countDocuments({ estado: 'Finalizada' }),
    Reserva.aggregate([
      { $match: { estado: 'CONFIRMADA', eliminado: false } },
      { $lookup: { from: 'inmuebles', localField: 'inmueble', foreignField: '_id', as: 'inmuebleDoc' } },
      { $unwind: '$inmuebleDoc' },
      { $match: { 'inmuebleDoc.modalidad': 'arriendo' } },
      { $count: 'total' },
    ]),
    Pago.countDocuments({ estado: 'RECHAZADO' }),
  ]);

  return {
    totalRecaudado: totalPagadoAgg[0]?.total || 0,
    totalVentas,
    totalArrendamientos: arriendosAgg[0]?.total || 0,
    pagosRechazados,
    rango: rangoListado,
  };
}

// HU-21.1: pagos por rango de fechas.
async function listadoPagos(rangoListado) {
  const pagos = await Pago.find({ createdAt: { $gte: rangoListado.desde, $lte: rangoListado.hasta } })
    .populate({
      path: 'reserva',
      select: 'codigo cliente',
      populate: { path: 'cliente', select: 'nombre apellido' },
    })
    .sort({ createdAt: -1 })
    .limit(LIMITE_LISTADO);

  return pagos.map((p) => ({
    monto: p.monto,
    estado: p.estado,
    fecha: p.createdAt,
    codigoReserva: p.reserva?.codigo || '',
    cliente: p.reserva?.cliente ? `${p.reserva.cliente.nombre} ${p.reserva.cliente.apellido}` : '',
  }));
}

// HU-21.2: contratos vigentes (sin filtro de fecha, igual que Contrato::listaVigentes del PHP original).
async function listadoContratosVigentes() {
  const contratos = await Contrato.find({ estado: 'Vigente' })
    .populate('inmueble', 'titulo')
    .populate({ path: 'reserva', select: 'cliente', populate: { path: 'cliente', select: 'nombre apellido' } })
    .sort({ fechaInicio: -1 })
    .limit(LIMITE_LISTADO);

  return contratos.map((c) => ({
    numeroContrato: c.numeroContrato,
    fechaInicio: c.fechaInicio,
    fechaFin: c.fechaFin,
    valorMensual: c.valorMensual,
    cliente: c.reserva?.cliente ? `${c.reserva.cliente.nombre} ${c.reserva.cliente.apellido}` : '',
    inmueble: c.inmueble?.titulo || '',
  }));
}

// HU-21.3: ventas por rango de fechas.
async function listadoVentas(rangoListado) {
  const ventas = await Venta.find({ fechaVenta: { $gte: rangoListado.desde, $lte: rangoListado.hasta } })
    .populate('inmueble', 'titulo codigo')
    .populate('asesor', 'nombre apellido')
    .sort({ fechaVenta: -1 })
    .limit(LIMITE_LISTADO);

  return ventas.map((v) => ({
    inmueble: v.inmueble?.titulo || '',
    asesor: v.asesor ? `${v.asesor.nombre} ${v.asesor.apellido}` : 'Sin asignar',
    precioVenta: v.precioVenta,
    fechaVenta: v.fechaVenta,
    estado: v.estado,
  }));
}

async function obtenerResumen(filtros = {}) {
  const periodo = filtros.periodo || 'mes';
  const rangoPeriodo = calcularRangoPeriodo(periodo);
  const rangoListado = rangoFechasExplicito(filtros.fechaInicio, filtros.fechaFin, rangoPeriodo);

  const [inmuebles, reservas, clientes, financiero, pagos, contratosVigentes, ventas] = await Promise.all([
    resumenInmuebles(rangoPeriodo, filtros),
    resumenReservas(rangoListado, filtros),
    resumenClientes(rangoPeriodo),
    resumenFinanciero(rangoListado),
    listadoPagos(rangoListado),
    listadoContratosVigentes(),
    listadoVentas(rangoListado),
  ]);

  return {
    periodo,
    rango: rangoListado,
    inmuebles,
    reservas,
    clientes,
    financiero,
    listadoPagos: pagos,
    listadoContratosVigentes: contratosVigentes,
    listadoVentas: ventas,
  };
}

module.exports = { obtenerResumen };
