const { Router } = require('express');
const { body } = require('express-validator');
const controlador = require('../controladores/notificaciones.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const { ROLES } = require('../utilidades/constantes');

const router = Router();

router.use(autenticacion);

router.get('/', controlador.listar);
router.get('/contador', controlador.contador);
router.patch('/:id/leida', controlador.marcarUna);
router.patch('/leer-todas', controlador.marcarTodas);

const broadcastValidador = [
  body('destino').isIn(['todos', 'individual']),
  body('usuarioId').optional().isMongoId(),
  body('titulo').isString().trim().notEmpty(),
  body('mensaje').isString().trim().notEmpty(),
];

router.post(
  '/admin/enviar',
  requerirRoles([ROLES.ADMINISTRADOR]),
  broadcastValidador,
  validarPeticion,
  controlador.enviarBroadcast
);

module.exports = router;
