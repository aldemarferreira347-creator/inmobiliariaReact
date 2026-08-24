const { body, param } = require('express-validator');
const { TODOS_LOS_ROLES, ESTADOS_USUARIO } = require('../utilidades/constantes');

const actualizarPerfilValidador = [
  body('nombre').optional().trim().isLength({ max: 100 }),
  body('apellido').optional().trim().isLength({ max: 100 }),
  body('telefono').optional().trim(),
  body('direccion').optional().trim(),
];

const solicitarCambioContrasenaValidador = [
  body('contrasenaActual').isString().notEmpty(),
  body('contrasenaNueva').isString().isLength({ min: 8 }),
];

const crearConRolValidador = [
  body('nombre').trim().notEmpty(),
  body('apellido').trim().notEmpty(),
  body('correo').trim().isEmail().normalizeEmail(),
  body('contrasena').isString().isLength({ min: 8 }),
  body('rol').isIn(TODOS_LOS_ROLES),
];

const cambiarRolValidador = [param('id').isMongoId(), body('rol').isIn(TODOS_LOS_ROLES)];

const cambiarEstadoValidador = [param('id').isMongoId(), body('estado').isIn(Object.values(ESTADOS_USUARIO))];

const actualizarUsuarioAdminValidador = [
  param('id').isMongoId(),
  body('nombre').optional().trim().notEmpty().isLength({ max: 100 }),
  body('apellido').optional().trim().isLength({ max: 100 }),
  body('correo').optional().trim().isEmail().normalizeEmail(),
  body('telefono').optional().trim(),
];

module.exports = {
  actualizarPerfilValidador,
  solicitarCambioContrasenaValidador,
  crearConRolValidador,
  cambiarRolValidador,
  cambiarEstadoValidador,
  actualizarUsuarioAdminValidador,
};
