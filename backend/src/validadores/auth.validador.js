const { body, param } = require('express-validator');

const registroValidador = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Correo invalido').normalizeEmail(),
  body('documento_tipo').trim().notEmpty().withMessage('El tipo de documento es obligatorio'),
  body('documento_numero').trim().notEmpty().withMessage('El numero de documento es obligatorio'),
  body('contrasena').isString().isLength({ min: 8 }).withMessage('La contrasena debe tener minimo 8 caracteres'),
  body('telefono').optional().trim(),
  body('fecha_nacimiento').optional().trim(),
  body('ciudad').optional().trim(),
  body('direccion').optional().trim(),
  // RN-19 y buenas practicas: nunca aceptar campos de tarjeta en un endpoint que no sea de pagos.
  body(['numeroTarjeta', 'cvv']).not().exists().withMessage('Campo no permitido'),
];

const loginValidador = [
  body('email').trim().isEmail().withMessage('Correo invalido').normalizeEmail(),
  body('contrasena').isString().notEmpty().withMessage('La contrasena es obligatoria'),
];

const recuperarPasswordValidador = [body('correo').trim().isEmail().withMessage('Correo invalido').normalizeEmail()];

const resetearPasswordValidador = [
  param('token').isString().notEmpty(),
  body('contrasenaNueva').isString().isLength({ min: 8 }).withMessage('La contrasena debe tener minimo 8 caracteres'),
];

module.exports = {
  registroValidador,
  loginValidador,
  recuperarPasswordValidador,
  resetearPasswordValidador,
};
