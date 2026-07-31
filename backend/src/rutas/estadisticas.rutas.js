const { Router } = require('express');
const controlador = require('../controladores/estadisticas.controlador');

const router = Router();

// Publica (HU sin numero, contador de la home) - sin autenticacion, igual que el PHP original.
router.get('/', controlador.obtener);

module.exports = router;
