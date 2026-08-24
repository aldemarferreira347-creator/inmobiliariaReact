const { Router } = require('express');
const controlador = require('../controladores/mensajes.controlador');
const autenticacion = require('../middlewares/autenticacion');
const validarPeticion = require('../middlewares/validacion');
const { enviarMensajeValidador, otroIdValidador, enviarContactoValidador } = require('../validadores/mensaje.validador');

const router = Router();

router.use(autenticacion);

router.get('/conversaciones', controlador.conversaciones);
router.get('/no-leidos/contador', controlador.noLeidosCount);
router.post('/contacto', enviarContactoValidador, validarPeticion, controlador.enviarContacto);
router.post('/', enviarMensajeValidador, validarPeticion, controlador.enviar);
router.get('/hilo/:otroId', otroIdValidador, validarPeticion, controlador.hilo);
router.get('/hilo/:otroId/nuevos', otroIdValidador, validarPeticion, controlador.nuevosDesde);
router.post('/hilo/:otroId/marcar-leidos', otroIdValidador, validarPeticion, controlador.marcarLeidos);

module.exports = router;
