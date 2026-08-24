const { Router } = require('express');
const controlador = require('../controladores/auth.controlador');
const autenticacion = require('../middlewares/autenticacion');
const validarPeticion = require('../middlewares/validacion');
const { limitadorLogin } = require('../middlewares/limitadorPeticiones');
const {
  registroValidador,
  loginValidador,
  recuperarPasswordValidador,
  resetearPasswordValidador,
  confirmarCambioContrasenaValidador,
} = require('../validadores/auth.validador');

const router = Router();

router.post('/registro', registroValidador, validarPeticion, controlador.registro);
router.post('/login', limitadorLogin, loginValidador, validarPeticion, controlador.login);
router.post('/refresh', controlador.refrescar);
router.post('/logout', controlador.logout);
router.get('/perfil', autenticacion, controlador.perfil);
router.post(
  '/recuperar-password',
  limitadorLogin,
  recuperarPasswordValidador,
  validarPeticion,
  controlador.recuperarPassword
);
router.post('/resetear-password/:token', resetearPasswordValidador, validarPeticion, controlador.resetearPassword);
router.post(
  '/confirmar-cambio-password/:token',
  confirmarCambioContrasenaValidador,
  validarPeticion,
  controlador.confirmarCambioContrasena
);

module.exports = router;
