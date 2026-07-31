const { Router } = require('express');
const controlador = require('../controladores/tarjetas.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const { ROLES } = require('../utilidades/constantes');
const { guardarTarjetaValidador, idTarjetaValidador } = require('../validadores/tarjeta.validador');

const router = Router();

router.use(autenticacion, requerirRoles([ROLES.CLIENTE]));

router.post('/setup-intent', controlador.setupIntent);
router.get('/', controlador.listar);
router.post('/', guardarTarjetaValidador, validarPeticion, controlador.guardar);
router.delete('/:id', idTarjetaValidador, validarPeticion, controlador.eliminar);

module.exports = router;
