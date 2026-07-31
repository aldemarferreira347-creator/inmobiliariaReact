const { body, param, query } = require('express-validator');

const solicitarCitaValidador = [
  body('inmuebleId').isMongoId(),
  body('fecha').isISO8601().withMessage('Fecha invalida (usar formato YYYY-MM-DD)'),
  body('horaInicio').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('horaFin').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
];

const franjasQueryValidador = [query('fecha').isISO8601()];

const idCitaValidador = [param('id').isMongoId()];

const asignarCitaValidador = [param('id').isMongoId(), body('asesorId').isMongoId()];

const observacionValidador = [param('id').isMongoId(), body('contenido').isString().trim().notEmpty()];

module.exports = {
  solicitarCitaValidador,
  franjasQueryValidador,
  idCitaValidador,
  asignarCitaValidador,
  observacionValidador,
};
