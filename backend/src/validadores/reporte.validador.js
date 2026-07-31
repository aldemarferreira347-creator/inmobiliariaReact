const { query } = require('express-validator');

const filtrosReporteValidador = [
  query('periodo').optional({ checkFalsy: true }).isIn(['semana', 'mes', 'anio', 'año']),
  query('tipo').optional({ checkFalsy: true }).isString(),
  query('estado').optional({ checkFalsy: true }).isString(),
  query('ciudad').optional({ checkFalsy: true }).isString(),
  query('fechaInicio').optional({ checkFalsy: true }).isISO8601(),
  query('fechaFin').optional({ checkFalsy: true }).isISO8601(),
];

module.exports = { filtrosReporteValidador };
