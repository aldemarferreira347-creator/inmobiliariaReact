const { Router } = require('express');
const controlador = require('../controladores/contratos.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const subida = require('../middlewares/subidaArchivos');
const { ROLES } = require('../utilidades/constantes');
const { crearContratoValidador, idContratoValidador } = require('../validadores/contrato.validador');

const router = Router();
const soloAdmin = requerirRoles([ROLES.ADMINISTRADOR]);

router.use(autenticacion);

// Cliente (HU-19.1/19.4)
router.get('/mis-arriendos', requerirRoles([ROLES.CLIENTE]), controlador.misArriendos);

// Admin
router.get('/', soloAdmin, controlador.listar);
router.get('/reservas-disponibles', soloAdmin, controlador.reservasDisponibles);
router.post('/', soloAdmin, crearContratoValidador, validarPeticion, controlador.crear);
router.post('/admin/marcar-vencidos', soloAdmin, controlador.marcarVencidosManual);
router.post(
  '/:id/archivo',
  soloAdmin,
  idContratoValidador,
  validarPeticion,
  subida.single('archivo'),
  controlador.subirArchivo
);
router.patch('/:id/rescindir', soloAdmin, idContratoValidador, validarPeticion, controlador.rescindir);

// Compartida (admin o cliente propietario - ownership validado en el servicio)
router.get('/:id/descargar', idContratoValidador, validarPeticion, controlador.descargar);
router.get('/:id', idContratoValidador, validarPeticion, controlador.detalle);

module.exports = router;
