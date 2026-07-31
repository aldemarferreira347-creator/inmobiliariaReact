const asyncHandler = require('../utilidades/asyncHandler');
const stripeServicio = require('../servicios/stripeServicio');

// req.body es el Buffer crudo (ver montaje de express.raw en app.js) - imprescindible para
// verificar la firma de Stripe antes de confiar en el contenido.
const recibirStripe = asyncHandler(async (req, res) => {
  const firma = req.headers['stripe-signature'];
  await stripeServicio.procesarWebhook(req.body, firma);
  res.json({ recibido: true });
});

module.exports = { recibirStripe };
