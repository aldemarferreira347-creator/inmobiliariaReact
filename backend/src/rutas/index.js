const { Router } = require('express');

const authRutas = require('./auth.rutas');
const usuariosRutas = require('./usuarios.rutas');
const permisosRutas = require('./permisos.rutas');
const inmueblesRutas = require('./inmuebles.rutas');
const favoritosRutas = require('./favoritos.rutas');
const citasRutas = require('./citas.rutas');
const franjasRutas = require('./franjas.rutas');
const mensajesRutas = require('./mensajes.rutas');
const notificacionesRutas = require('./notificaciones.rutas');
const reservasRutas = require('./reservas.rutas');
const tarjetasRutas = require('./tarjetas.rutas');
const contratosRutas = require('./contratos.rutas');
const ventasRutas = require('./ventas.rutas');
const estadisticasRutas = require('./estadisticas.rutas');
const reportesRutas = require('./reportes.rutas');

const router = Router();

router.get('/salud', (req, res) => {
  res.json({ exito: true, mensaje: 'API funcionando', fecha: new Date().toISOString() });
});

router.use('/auth', authRutas);
router.use('/usuarios', usuariosRutas);
router.use('/permisos', permisosRutas);
router.use('/inmuebles', inmueblesRutas);
router.use('/favoritos', favoritosRutas);
router.use('/citas', citasRutas);
router.use('/franjas', franjasRutas);
router.use('/mensajes', mensajesRutas);
router.use('/notificaciones', notificacionesRutas);
router.use('/reservas', reservasRutas);
router.use('/tarjetas', tarjetasRutas);
router.use('/contratos', contratosRutas);
router.use('/ventas', ventasRutas);
router.use('/estadisticas', estadisticasRutas);
router.use('/reportes', reportesRutas);

module.exports = router;
