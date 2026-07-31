const { body, param } = require('express-validator');

const registrarVentaValidador = [
  body('inmuebleId').isMongoId(),
  body('clienteId').isMongoId(),
  body('precioVenta').isFloat({ min: 0 }),
  body('fechaVenta').isISO8601().withMessage('Fecha de venta invalida (usar formato YYYY-MM-DD)'),
  body('notaria').optional({ nullable: true }).isString().trim(),
];

const idVentaValidador = [param('id').isMongoId()];

const cambiarEstadoVentaValidador = [
  param('id').isMongoId(),
  body('estado').isIn(['Finalizada', 'Cancelada']),
];

module.exports = {
  registrarVentaValidador,
  idVentaValidador,
  cambiarEstadoVentaValidador,
};
