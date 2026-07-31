const { Router } = require('express');
const controlador = require('../controladores/favoritos.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const { ROLES } = require('../utilidades/constantes');

const router = Router();

router.use(autenticacion, requerirRoles([ROLES.CLIENTE]));

router.get('/', controlador.listar);
router.post('/:inmuebleId', controlador.alternar);

module.exports = router;
