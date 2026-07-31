const ApiError = require('../utilidades/ApiError');
const logger = require('../utilidades/logger');
const entorno = require('../configuracion/entorno');

function rutaNoEncontrada(req, res, next) {
  next(ApiError.noEncontrado(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

function manejoErrores(error, req, res, next) { // eslint-disable-line no-unused-vars
  let apiError = error;

  if (error.name === 'ValidationError') {
    apiError = ApiError.badRequest('Error de validacion', error.errors);
  } else if (error.code === 11000) {
    apiError = ApiError.conflicto('El recurso ya existe (valor duplicado)', error.keyValue);
  } else if (error.name === 'CastError') {
    apiError = ApiError.badRequest('Identificador invalido');
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    apiError = ApiError.noAutorizado('Token invalido o expirado');
  } else if (!(error instanceof ApiError)) {
    logger.error('Error no controlado', error);
    apiError = ApiError.interno();
  }

  if (apiError.statusCode >= 500) {
    logger.error(apiError.message, error);
  }

  res.status(apiError.statusCode).json({
    exito: false,
    mensaje: apiError.message,
    detalles: apiError.detalles || undefined,
    stack: !entorno.esProduccion ? error.stack : undefined,
  });
}

module.exports = { rutaNoEncontrada, manejoErrores };
