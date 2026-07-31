const { Router } = require('express');
const controlador = require('../controladores/ventas.controlador');
const autenticacion = require('../middlewares/autenticacion');
const { requerirRoles } = require('../middlewares/autorizacion');
const validarPeticion = require('../middlewares/validacion');
const subida = require('../middlewares/subidaArchivos');
const { ROLES } = require('../utilidades/constantes');
const {
  registrarVentaValidador,
  idVentaValidador,
  cambiarEstadoVentaValidador,
} = require('../validadores/venta.validador');

const router = Router();
const asesorOAdmin = requerirRoles([ROLES.ASESOR, ROLES.ADMINISTRADOR]);

router.use(autenticacion);

// Cliente (HU-19.2)
router.get('/mis-compras', requerirRoles([ROLES.CLIENTE]), controlador.misCompras);

// Asesor / admin
router.get('/inmuebles-disponibles', asesorOAdmin, controlador.inmueblesDisponibles);
router.get('/clientes', asesorOAdmin, controlador.clientesActivos);
router.get('/mias', requerirRoles([ROLES.ASESOR]), controlador.misVentas);
router.get('/', requerirRoles([ROLES.ADMINISTRADOR]), controlador.listarTodas);
router.post('/', asesorOAdmin, registrarVentaValidador, validarPeticion, controlador.registrar);
router.post(
  '/:id/escritura',
  asesorOAdmin,
  idVentaValidador,
  validarPeticion,
  subida.single('archivo'),
  controlador.subirEscritura
);
router.patch('/:id/estado', asesorOAdmin, cambiarEstadoVentaValidador, validarPeticion, controlador.cambiarEstado);

// Compartida (admin, asesor propietario o cliente propietario - ownership validado en el controlador)
router.get('/:id/escritura', idVentaValidador, validarPeticion, controlador.descargarEscritura);
router.get('/:id', idVentaValidador, validarPeticion, controlador.detalle);

module.exports = router;
