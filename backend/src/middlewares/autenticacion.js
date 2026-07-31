const Usuario = require('../modelos/Usuario');
const ApiError = require('../utilidades/ApiError');
const asyncHandler = require('../utilidades/asyncHandler');
const { verificarAccessToken, COOKIE_ACCESO } = require('../servicios/tokenServicio');
const { ESTADOS_USUARIO } = require('../utilidades/constantes');

const autenticacion = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_ACCESO];
  if (!token) {
    throw ApiError.noAutorizado('No hay sesion activa');
  }

  let payload;
  try {
    payload = verificarAccessToken(token);
  } catch (error) {
    throw ApiError.noAutorizado('Sesion invalida o expirada');
  }

  // Se relee el usuario de BD en cada peticion (no solo el payload del token) para que un cambio
  // de rol o una desactivacion de cuenta por el admin surta efecto de inmediato.
  const usuario = await Usuario.findById(payload.sub);

  if (!usuario) {
    throw ApiError.noAutorizado('Usuario no encontrado');
  }
  if (usuario.estado === ESTADOS_USUARIO.INACTIVO) {
    throw ApiError.noAutorizado('Cuenta desactivada');
  }
  if (usuario.tokenVersion !== payload.tokenVersion) {
    throw ApiError.noAutorizado('Sesion invalidada, inicia sesion de nuevo');
  }

  usuario.ultimoAcceso = new Date();
  await usuario.save({ validateBeforeSave: false });

  req.usuario = usuario;
  next();
});

module.exports = autenticacion;
