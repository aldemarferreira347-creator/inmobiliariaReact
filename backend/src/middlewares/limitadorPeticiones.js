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

// Defensa en profundidad por IP para /perfil/solicitar-cambio-contrasena; el limite real de
// 3 solicitudes/hora por usuario se aplica ademas contra BD en usuarioServicio (HU-25).
const limitadorCambioPassword = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { exito: false, mensaje: 'Demasiadas solicitudes, intenta de nuevo mas tarde.' },
});

module.exports = { limitadorGeneral, limitadorLogin, limitadorCambioPassword };
