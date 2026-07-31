const { body, param } = require('express-validator');

const crearContratoValidador = [
  body('reservaId').isMongoId(),
  body('fechaInicio').isISO8601().withMessage('Fecha de inicio invalida (usar formato YYYY-MM-DD)'),
  body('fechaFin').optional({ nullable: true }).isISO8601().withMessage('Fecha de fin invalida (usar formato YYYY-MM-DD)'),
  body('valorMensual').isFloat({ min: 0 }),
];

const idContratoValidador = [param('id').isMongoId()];

module.exports = {
  crearContratoValidador,
  idContratoValidador,
};
