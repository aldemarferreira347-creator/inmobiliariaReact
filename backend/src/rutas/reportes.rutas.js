const { Router } = require('express');
const controlador = require('../controladores/reportes.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const { ROLES } = require('../utilidades/constantes');
const { filtrosReporteValidador } = require('../validadores/reporte.validador');

const router = Router();

router.use(autenticacion, requerirRoles([ROLES.ADMINISTRADOR]));

router.get('/datos', filtrosReporteValidador, validarPeticion, controlador.datos);
router.get('/exportar-excel', filtrosReporteValidador, validarPeticion, controlador.exportarExcel);
router.get('/exportar-pdf', filtrosReporteValidador, validarPeticion, controlador.exportarPdf);

module.exports = router;
