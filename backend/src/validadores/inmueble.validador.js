const { body, param } = require('express-validator');
const { TIPOS, MODALIDADES } = require('../modelos/Inmueble');

const crearInmuebleValidador = [
  body('titulo').trim().notEmpty().isLength({ max: 150 }),
  body('descripcion').trim().isLength({ min: 50 }).withMessage('La descripcion debe tener minimo 50 caracteres'),
  body('tipo').isIn(TIPOS),
  body('modalidad').isIn([...MODALIDADES, 'ambos']),
  body('precio').isFloat({ min: 0 }),
  body('habitaciones').optional().isInt({ min: 0 }),
  body('banos').optional().isInt({ min: 0 }),
  body('areaM2').optional().isFloat({ min: 0 }),
  body('ubicacion.ciudad').trim().notEmpty().withMessage('La ciudad es obligatoria'),
];

const actualizarInmuebleValidador = [param('id').isMongoId(), ...crearInmuebleValidador];

const idInmuebleValidador = [param('id').isMongoId()];

module.exports = { crearInmuebleValidador, actualizarInmuebleValidador, idInmuebleValidador };
