const stripe = require('../configuracion/stripe');
const entorno = require('../configuracion/entorno');
const PagoWebhookLog = require('../modelos/PagoWebhookLog');
const pagoServicio = require('./pagoServicio');
const reservaServicio = require('./reservaServicio');
const ApiError = require('../utilidades/ApiError');
const logger = require('../utilidades/logger');

// Colombia (COP) no es una moneda de "cero decimales" para Stripe: hay que multiplicar por 100,
// igual que el comentario en StripeService.php del PHP original (omitirlo cobraba 100 veces menos).
function montoACentavos(monto) {
  return Math.round(monto) * 100;
}

// Flujo 1: Checkout Session (pagina alojada por Stripe) - equivalente a
// StripeService::crearSesionCheckout del PHP original. La confirmacion real de la reserva SIEMPRE
// llega por el webhook, nunca por el redirect de success_url (que es solo informativo).
async function crearSesionCheckout(reserva, pago) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'cop',
          unit_amount: montoACentavos(reserva.monto),
          product_data: { name: `Reserva ${reserva.codigo}` },
        },
        quantity: 1,
      },
    ],
    metadata: {
      reservaId: String(reserva._id),
      codigoReserva: reserva.codigo,
      pagoId: String(pago._id),
    },
    success_url: `${entorno.urlFrontend}/reservas/${reserva._id}?pago=exitoso`,
    cancel_url: `${entorno.urlFrontend}/reservas/${reserva._id}?pago=cancelado`,
  });

  pago.stripeCheckoutSessionId = session.id;
  await pago.save();

  return { tipo: 'checkout', url: session.url };
}

async function procesarSesionCompletada(session) {
  const pago = await pagoServicio.buscarPorCheckoutSession(session.id);
  if (!pago) {
    logger.warn(`Webhook checkout.session.completed sin Pago local para session ${session.id}`);
    return;
  }
  if (pago.estado === 'PAGADO') return; // idempotente

  pago.estado = 'PAGADO';
  pago.stripePaymentIntentId = session.payment_intent;
  await pago.save();

  await reservaServicio.aprobarPago(pago.reserva);
}

async function procesarSesionExpirada(session) {
  const pago = await pagoServicio.buscarPorCheckoutSession(session.id);
  if (!pago) return;
  if (pago.estado === 'PAGADO') return;

  pago.estado = 'EXPIRADO';
  await pago.save();

  await reservaServicio.rechazarPago(pago.reserva, 'La sesion de pago de Stripe expiro');
}

async function procesarPaymentIntentExitoso(intent) {
  const pago = await pagoServicio.buscarPorPaymentIntent(intent.id);
  if (!pago) return; // pago del flujo Checkout: ya fue procesado por checkout.session.completed
  if (pago.estado === 'PAGADO') return; // idempotente

  pago.estado = 'PAGADO';
  await pago.save();

  await reservaServicio.aprobarPago(pago.reserva);
}

// Verifica la firma y aplica idempotencia (indice unico en PagoWebhookLog.stripeEventId) antes de
// tocar cualquier estado de negocio - un mismo evento reenviado por Stripe nunca se procesa dos
// veces, igual que INSERT IGNORE sobre (pasarela, evento_id) en el PHP original.
async function procesarWebhook(payloadCrudo, firma) {
  let evento;
  try {
    evento = stripe.webhooks.constructEvent(payloadCrudo, firma, entorno.stripe.webhookSecret);
  } catch (error) {
    throw ApiError.badRequest(`Firma de webhook invalida: ${error.message}`);
  }

  try {
    await PagoWebhookLog.create({ stripeEventId: evento.id, tipo: evento.type });
  } catch (error) {
    if (error.code === 11000) {
      logger.info(`Webhook ${evento.id} (${evento.type}) ya fue procesado, se ignora`);
      return;
    }
    throw error;
  }

  switch (evento.type) {
    case 'checkout.session.completed':
      await procesarSesionCompletada(evento.data.object);
      break;
    case 'checkout.session.expired':
      await procesarSesionExpirada(evento.data.object);
      break;
    case 'payment_intent.succeeded':
      await procesarPaymentIntentExitoso(evento.data.object);
      break;
    default:
      break;
  }

  await PagoWebhookLog.updateOne({ stripeEventId: evento.id }, { procesado: true, procesadoEn: new Date() });
}

module.exports = {
  montoACentavos,
  crearSesionCheckout,
  procesarWebhook,
};
