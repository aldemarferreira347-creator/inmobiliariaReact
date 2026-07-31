const { Router } = require('express');
const { body } = require('express-validator');
const controlador = require('../controladores/franjas.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const { ROLES } = require('../utilidades/constantes');

const router = Router();

const guardarFranjaValidador = [
  body('diaSemana').isInt({ min: 0, max: 6 }),
  body('horaInicio').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('horaFin').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('duracionSlotMinutos').optional().isInt({ min: 5 }),
  body('activo').optional().isBoolean(),
];

router.get('/', controlador.listar);
router.put(
  '/',
  autenticacion,
  requerirRoles([ROLES.ADMINISTRADOR]),
  guardarFranjaValidador,
  validarPeticion,
  controlador.guardar
);

module.exports = router;
