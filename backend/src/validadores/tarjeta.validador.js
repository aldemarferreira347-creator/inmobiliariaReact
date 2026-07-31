const { body, param } = require('express-validator');

const guardarTarjetaValidador = [
  body('paymentMethodId').isString().trim().matches(/^pm_/).withMessage('paymentMethodId invalido'),
];

const idTarjetaValidador = [param('id').isMongoId()];

module.exports = {
  guardarTarjetaValidador,
  idTarjetaValidador,
};
