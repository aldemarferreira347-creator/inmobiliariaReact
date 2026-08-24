const { body, param } = require('express-validator');

const enviarMensajeValidador = [
  body('destinatarioId').optional().isMongoId(),
  body('contenido').optional().isString().isLength({ max: 4000 }),
  body('adjuntoBase64').optional().isString(),
];

const otroIdValidador = [param('otroId').isMongoId()];

const enviarContactoValidador = [
  body('mensaje').trim().notEmpty().withMessage('El mensaje no puede estar vacio').isLength({ max: 2000 }),
  body('inmuebleId').optional().isMongoId(),
];

module.exports = { enviarMensajeValidador, otroIdValidador, enviarContactoValidador };
