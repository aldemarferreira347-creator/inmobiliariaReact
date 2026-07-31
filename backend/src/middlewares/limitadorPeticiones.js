const rateLimit = require('express-rate-limit');

const limitadorGeneral = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { exito: false, mensaje: 'Demasiadas peticiones, intenta de nuevo en un momento.' },
});

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { exito: false, mensaje: 'Demasiados intentos, intenta de nuevo mas tarde.' },
});

module.exports = { limitadorGeneral, limitadorLogin };
