const { Router } = require('express');
const controlador = require('../controladores/webhooks.controlador');

const router = Router();

router.post('/', controlador.recibirStripe);

module.exports = router;
