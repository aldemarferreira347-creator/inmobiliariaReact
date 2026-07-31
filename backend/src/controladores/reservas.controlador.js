const asyncHandler = require('../utilidades/asyncHandler');
const reservaServicio = require('../servicios/reservaServicio');
const stripeServicio = require('../servicios/stripeServicio');
const stripeTarjetaServicio = require('../servicios/stripeTarjetaServicio');
const { ROLES } = require('../utilidades/constantes');

// --- Cliente ---

const iniciar = asyncHandler(async (req, res) => {
  const reserva = await reservaServicio.iniciar(req.usuario._id, req.body.inmuebleId);
  res.status(201).json({ exito: true, reserva });
});

const misReservas = asyncHandler(async (req, res) => {
  const reservas = await reservaServicio.misReservas(req.usuario._id);
  res.json({ exito: true, reservas });
});

// Despacha al flujo de Checkout Session (sin metodoPagoGuardadoId) o al de PaymentIntent
// server-side contra una tarjeta ya tokenizada (con metodoPagoGuardadoId) - igual que
// ClienteReservasController::pagar del PHP original.
const pagar = asyncHandler(async (req, res) => {
  const { metodoPagoGuardadoId } = req.body;
  const { reserva, pago } = await reservaServicio.prepararPago(req.params.id, req.usuario._id, metodoPagoGuardadoId);

  const resultado = metodoPagoGuardadoId
    ? await stripeTarjetaServicio.pagarConTarjetaGuardada(reserva, pago, metodoPagoGuardadoId, req.usuario._id)
    : await stripeServicio.crearSesionCheckout(reserva, pago);

  res.json({ exito: true, ...resultado });
});

const cancelarPropia = asyncHandler(async (req, res) => {
  const reserva = await reservaServicio.cancelar(req.params.id, req.usuario._id, true);
  res.json({ exito: true, reserva });
});

// --- Compartido (propietario o admin) ---

const detalle = asyncHandler(async (req, res) => {
  const resultado = await reservaServicio.obtenerDetalle(req.params.id);
  const { reserva } = resultado;

  const esPropietario = String(reserva.cliente._id) === String(req.usuario._id);
  const esAdmin = req.usuario.rol === ROLES.ADMINISTRADOR;
  if (!esPropietario && !esAdmin) {
    return res.status(403).json({ exito: false, mensaje: 'No tienes acceso a esta reserva' });
  }

  return res.json({ exito: true, ...resultado });
});

// --- Admin ---

const listarTodas = asyncHandler(async (req, res) => {
  const reservas = await reservaServicio.listarTodas();
  res.json({ exito: true, reservas });
});

const cancelarAdmin = asyncHandler(async (req, res) => {
  const reserva = await reservaServicio.cancelar(req.params.id, req.usuario._id, false);
  res.json({ exito: true, reserva });
});

// Permite disparar manualmente el CRON de expiracion (verificacion / QA), ademas de la
// tarea programada horaria.
const expirarVencidasManual = asyncHandler(async (req, res) => {
  const totalExpiradas = await reservaServicio.expirarVencidas();
  res.json({ exito: true, totalExpiradas });
});

module.exports = {
  iniciar,
  misReservas,
  pagar,
  cancelarPropia,
  detalle,
  listarTodas,
  cancelarAdmin,
  expirarVencidasManual,
};
