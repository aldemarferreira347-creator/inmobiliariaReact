const { validationResult } = require('express-validator');
const ApiError = require('../utilidades/ApiError');

function validarPeticion(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return next(ApiError.badRequest('Error de validacion', errores.array()));
  }
  return next();
}

module.exports = validarPeticion;
