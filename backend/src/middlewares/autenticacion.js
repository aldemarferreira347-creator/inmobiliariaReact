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

  // Actualizar ultimoAcceso con throttling (maximo una escritura cada 60s por usuario)
  const ahora = new Date();
  const ultimoAccesoMs = usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).getTime() : 0;
  if (ahora.getTime() - ultimoAccesoMs > 60 * 1000) {
    usuario.ultimoAcceso = ahora;
    Usuario.updateOne({ _id: usuario._id }, { ultimoAcceso: ahora }).catch(() => {});
  }

  req.usuario = usuario;
  next();
});

module.exports = autenticacion;
