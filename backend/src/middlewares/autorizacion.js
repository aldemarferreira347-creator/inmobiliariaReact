const ApiError = require('../utilidades/ApiError');

function requerirRoles(rolesPermitidos) {
  return function (req, res, next) {
    if (!req.usuario) {
      return next(ApiError.noAutorizado());
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return next(ApiError.prohibido('No tienes permiso para acceder a este recurso'));
    }
    return next();
  };
}

module.exports = { requerirRoles };
