const { Router } = require('express');
const controlador = require('../controladores/inmuebles.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const subida = require('../middlewares/subidaArchivos');
const { ROLES } = require('../utilidades/constantes');
const {
  crearInmuebleValidador,
  actualizarInmuebleValidador,
  idInmuebleValidador,
} = require('../validadores/inmueble.validador');

const router = Router();
const soloAdmin = [autenticacion, requerirRoles([ROLES.ADMINISTRADOR])];

// --- Publicas ---
router.get('/', controlador.listar);
router.get('/destacados', controlador.destacados);
router.get('/tipos', controlador.tiposDisponibles);
router.get('/:id', idInmuebleValidador, validarPeticion, controlador.detalle);

// --- Administracion (HU-04, HU-08) ---
router.post('/', soloAdmin, crearInmuebleValidador, validarPeticion, controlador.crear);
router.put('/:id', soloAdmin, actualizarInmuebleValidador, validarPeticion, controlador.actualizar);
router.delete('/:id', soloAdmin, idInmuebleValidador, validarPeticion, controlador.eliminar);

router.post('/:id/imagenes', soloAdmin, idInmuebleValidador, validarPeticion, subida.single('imagen'), controlador.agregarImagen);
router.patch('/:id/imagenes/:imagenId/principal', soloAdmin, controlador.establecerPrincipal);
router.delete('/:id/imagenes/:imagenId', soloAdmin, controlador.eliminarImagen);

module.exports = router;
