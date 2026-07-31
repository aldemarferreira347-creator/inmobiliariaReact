const { Router } = require('express');
const controlador = require('../controladores/reservas.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const { ROLES } = require('../utilidades/constantes');
const {
  iniciarReservaValidador,
  idReservaValidador,
  pagarReservaValidador,
} = require('../validadores/reserva.validador');

const router = Router();

router.use(autenticacion);

// Cliente
router.post('/', requerirRoles([ROLES.CLIENTE]), iniciarReservaValidador, validarPeticion, controlador.iniciar);
router.get('/mias', requerirRoles([ROLES.CLIENTE]), controlador.misReservas);
router.post('/:id/pagar', requerirRoles([ROLES.CLIENTE]), pagarReservaValidador, validarPeticion, controlador.pagar);
router.patch(
  '/:id/cancelar',
  requerirRoles([ROLES.CLIENTE]),
  idReservaValidador,
  validarPeticion,
  controlador.cancelarPropia
);

// Admin
router.get('/', requerirRoles([ROLES.ADMINISTRADOR]), controlador.listarTodas);
router.patch(
  '/:id/cancelar-admin',
  requerirRoles([ROLES.ADMINISTRADOR]),
  idReservaValidador,
  validarPeticion,
  controlador.cancelarAdmin
);
router.post('/admin/expirar-vencidas', requerirRoles([ROLES.ADMINISTRADOR]), controlador.expirarVencidasManual);

// Compartida (cliente propietario o admin - ownership validado en el controlador)
router.get('/:id', idReservaValidador, validarPeticion, controlador.detalle);

module.exports = router;
