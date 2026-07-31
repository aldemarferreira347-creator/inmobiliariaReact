const stripe = require('../configuracion/stripe');
const entorno = require('../configuracion/entorno');
const Usuario = require('../modelos/Usuario');
const MetodoPagoGuardado = require('../modelos/MetodoPagoGuardado');
const { montoACentavos } = require('./stripeServicio');
const reservaServicio = require('./reservaServicio');
const ApiError = require('../utilidades/ApiError');
const logger = require('../utilidades/logger');

function capitalizar(texto) {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Un solo Stripe Customer por cliente, reutilizado entre el SetupIntent y cualquier PaymentIntent
// posterior - se persiste en Usuario.perfilCliente.stripeCustomerId para no depender de que ya
// exista una tarjeta guardada (a diferencia de StripeCardService::obtenerOcrearCustomer del PHP
// original, que lo derivaba de metodo_pago_guardado y fallaba si aun no habia ninguna tarjeta).
async function obtenerOcrearCustomerId(clienteId) {
  const usuario = await Usuario.findById(clienteId);
  if (!usuario) throw ApiError.noEncontrado('Usuario no encontrado');

  if (usuario.perfilCliente?.stripeCustomerId) {
    return usuario.perfilCliente.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    name: `${usuario.nombre} ${usuario.apellido}`,
    email: usuario.correo,
    metadata: { clienteId: String(usuario._id) },
  });

  if (!usuario.perfilCliente) usuario.perfilCliente = {};
  usuario.perfilCliente.stripeCustomerId = customer.id;
  await usuario.save({ validateBeforeSave: false });

  return customer.id;
}

async function crearSetupIntent(clienteId) {
  const customerId = await obtenerOcrearCustomerId(clienteId);
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });

  return { clientSecret: setupIntent.client_secret, publishableKey: entorno.stripe.publishableKey };
}

async function guardarTarjeta(clienteId, paymentMethodId) {
  const customerId = await obtenerOcrearCustomerId(clienteId);
  const metodoPago = await stripe.paymentMethods.retrieve(paymentMethodId);

  // Anti-manipulacion: el PaymentMethod recibido debe pertenecer al mismo Customer del cliente que
  // hace la peticion - igual que StripeCardService::guardarTarjeta del PHP original.
  if (metodoPago.customer !== customerId) {
    throw ApiError.badRequest('El metodo de pago no pertenece a este cliente');
  }
  if (metodoPago.type !== 'card' || !metodoPago.card) {
    throw ApiError.badRequest('El metodo de pago debe ser una tarjeta');
  }

  try {
    return await MetodoPagoGuardado.create({
      cliente: clienteId,
      stripeCustomerId: customerId,
      stripePaymentMethodId: metodoPago.id,
      marca: capitalizar(metodoPago.card.brand),
      ultimos4: metodoPago.card.last4,
      nombreTitular: metodoPago.billing_details?.name || '',
      mesExpiracion: metodoPago.card.exp_month,
      anioExpiracion: metodoPago.card.exp_year,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflicto('Esta tarjeta ya esta guardada');
    }
    throw error;
  }
}

async function listar(clienteId) {
  return MetodoPagoGuardado.find({ cliente: clienteId, activo: true }).sort({ predeterminado: -1, createdAt: -1 });
}

async function eliminar(clienteId, tarjetaId) {
  const tarjeta = await MetodoPagoGuardado.findOne({ _id: tarjetaId, cliente: clienteId, activo: true });
  if (!tarjeta) throw ApiError.noEncontrado('Tarjeta no encontrada');

  try {
    await stripe.paymentMethods.detach(tarjeta.stripePaymentMethodId);
  } catch (error) {
    logger.error(`Fallo al desvincular el metodo de pago ${tarjeta.stripePaymentMethodId} en Stripe`, error);
  }

  tarjeta.activo = false;
  await tarjeta.save();
}

function mapearEstadoPago(estadoStripe) {
  if (estadoStripe === 'succeeded') return 'PAGADO';
  if (['requires_action', 'requires_confirmation', 'processing'].includes(estadoStripe)) return 'PROCESANDO';
  return 'RECHAZADO';
}

// Flujo 2: PaymentIntent confirmado server-side contra una tarjeta ya tokenizada - equivalente a
// StripeCardService::pagarConTarjetaGuardada del PHP original. No usa Stripe.js/Elements para el
// cobro en si (solo se uso Elements antes, para tokenizar la tarjeta via SetupIntent).
async function pagarConTarjetaGuardada(reserva, pago, tarjetaId, clienteId) {
  const tarjeta = await MetodoPagoGuardado.findOne({ _id: tarjetaId, cliente: clienteId, activo: true });
  if (!tarjeta) throw ApiError.noEncontrado('Tarjeta guardada no encontrada');

  let intent;
  try {
    intent = await stripe.paymentIntents.create({
      amount: montoACentavos(reserva.monto),
      currency: 'cop',
      customer: tarjeta.stripeCustomerId,
      payment_method: tarjeta.stripePaymentMethodId,
      payment_method_types: ['card'],
      off_session: false,
      confirm: true,
      metadata: {
        reservaId: String(reserva._id),
        codigoReserva: reserva.codigo,
        pagoId: String(pago._id),
      },
    });
  } catch (error) {
    if (error.type === 'StripeCardError') {
      pago.estado = 'RECHAZADO';
      await pago.save();
      throw ApiError.reglaDeNegocio(`Pago rechazado: ${error.message}`);
    }
    throw error;
  }

  pago.stripePaymentIntentId = intent.id;
  pago.estado = mapearEstadoPago(intent.status);
  await pago.save();

  if (intent.status === 'succeeded') {
    await reservaServicio.aprobarPago(reserva._id);
    return { tipo: 'payment_intent', estado: 'succeeded' };
  }

  if (intent.status === 'requires_action') {
    return { tipo: 'payment_intent', estado: 'requires_action', clientSecret: intent.client_secret };
  }

  throw ApiError.reglaDeNegocio(`El pago no pudo procesarse (estado: ${intent.status})`);
}

module.exports = {
  crearSetupIntent,
  guardarTarjeta,
  listar,
  eliminar,
  pagarConTarjetaGuardada,
};
