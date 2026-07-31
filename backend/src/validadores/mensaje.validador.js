const { body, param } = require('express-validator');

const enviarMensajeValidador = [
  body('destinatarioId').optional().isMongoId(),
  body('contenido').optional().isString().isLength({ max: 4000 }),
  body('adjuntoBase64').optional().isString(),
];

const otroIdValidador = [param('otroId').isMongoId()];

module.exports = { enviarMensajeValidador, otroIdValidador };
