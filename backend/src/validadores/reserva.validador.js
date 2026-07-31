const { body, param } = require('express-validator');

const iniciarReservaValidador = [body('inmuebleId').isMongoId()];

const idReservaValidador = [param('id').isMongoId()];

const pagarReservaValidador = [
  param('id').isMongoId(),
  body('metodoPagoGuardadoId').optional({ nullable: true }).isMongoId(),
];

module.exports = {
  iniciarReservaValidador,
  idReservaValidador,
  pagarReservaValidador,
};
