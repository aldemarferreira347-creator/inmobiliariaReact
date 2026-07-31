const { Router } = require('express');
const controlador = require('../controladores/citas.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const { ROLES } = require('../utilidades/constantes');
const {
  solicitarCitaValidador,
  franjasQueryValidador,
  idCitaValidador,
  asignarCitaValidador,
  observacionValidador,
} = require('../validadores/cita.validador');

const router = Router();

router.use(autenticacion);

// Cliente
router.get('/franjas-disponibles', franjasQueryValidador, validarPeticion, controlador.franjasDisponibles);
router.post('/', requerirRoles([ROLES.CLIENTE]), solicitarCitaValidador, validarPeticion, controlador.solicitar);
router.get('/mias', requerirRoles([ROLES.CLIENTE]), controlador.misCitas);
router.patch('/:id/cancelar', requerirRoles([ROLES.CLIENTE]), idCitaValidador, validarPeticion, controlador.cancelarPropia);

// Asesor
router.get('/asesor/mias', requerirRoles([ROLES.ASESOR]), controlador.citasDeAsesor);
router.post(
  '/:id/observacion',
  requerirRoles([ROLES.ASESOR]),
  observacionValidador,
  validarPeticion,
  controlador.registrarObservacion
);

// Admin
router.get('/sin-asignar', requerirRoles([ROLES.ADMINISTRADOR]), controlador.sinAsignar);
router.get('/agrupadas-por-asesor', requerirRoles([ROLES.ADMINISTRADOR]), controlador.agrupadasPorAsesor);
router.get('/asesores-disponibles', requerirRoles([ROLES.ADMINISTRADOR]), controlador.asesoresDisponibles);
router.patch(
  '/:id/asignar',
  requerirRoles([ROLES.ADMINISTRADOR]),
  asignarCitaValidador,
  validarPeticion,
  controlador.asignar
);

// Compartida (valida ownership internamente)
router.get('/:id', idCitaValidador, validarPeticion, controlador.detalle);

module.exports = router;
