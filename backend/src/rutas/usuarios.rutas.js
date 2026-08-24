const { Router } = require('express');
const controlador = require('../controladores/usuarios.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const subida = require('../middlewares/subidaArchivos');
const { limitadorCambioPassword } = require('../middlewares/limitadorPeticiones');
const { ROLES } = require('../utilidades/constantes');
const {
  actualizarPerfilValidador,
  solicitarCambioContrasenaValidador,
  crearConRolValidador,
  cambiarRolValidador,
  cambiarEstadoValidador,
  actualizarUsuarioAdminValidador,
} = require('../validadores/usuario.validador');

const router = Router();

router.use(autenticacion);

router.put('/perfil', actualizarPerfilValidador, validarPeticion, controlador.actualizarPerfil);
router.post('/perfil/foto', subida.single('foto'), controlador.subirFotoPerfil);
router.delete('/perfil/foto', controlador.eliminarFotoPerfil);
router.post(
  '/perfil/solicitar-cambio-contrasena',
  limitadorCambioPassword,
  solicitarCambioContrasenaValidador,
  validarPeticion,
  controlador.solicitarCambioContrasena
);

router.get('/', requerirRoles([ROLES.ADMINISTRADOR]), controlador.listar);
router.post('/', requerirRoles([ROLES.ADMINISTRADOR]), crearConRolValidador, validarPeticion, controlador.crearConRol);
router.patch(
  '/:id',
  requerirRoles([ROLES.ADMINISTRADOR]),
  actualizarUsuarioAdminValidador,
  validarPeticion,
  controlador.actualizarUsuarioAdmin
);
router.patch(
  '/:id/rol',
  requerirRoles([ROLES.ADMINISTRADOR]),
  cambiarRolValidador,
  validarPeticion,
  controlador.cambiarRol
);
router.patch(
  '/:id/estado',
  requerirRoles([ROLES.ADMINISTRADOR]),
  cambiarEstadoValidador,
  validarPeticion,
  controlador.cambiarEstado
);
router.delete('/:id', requerirRoles([ROLES.ADMINISTRADOR]), controlador.eliminar);

module.exports = router;
