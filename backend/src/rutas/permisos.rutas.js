const { Router } = require('express');
const controlador = require('../controladores/permisos.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const { ROLES } = require('../utilidades/constantes');

const router = Router();

router.get('/', autenticacion, requerirRoles([ROLES.ADMINISTRADOR]), controlador.listar);

module.exports = router;
