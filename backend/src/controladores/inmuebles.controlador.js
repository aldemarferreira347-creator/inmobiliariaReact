const asyncHandler = require('../utilidades/asyncHandler');
const inmuebleServicio = require('../servicios/inmuebleServicio');
const Inmueble = require('../modelos/Inmueble');

const listar = asyncHandler(async (req, res) => {
  const resultado = await inmuebleServicio.filtrar(req.query);
  res.json({ exito: true, ...resultado });
});

const destacados = asyncHandler(async (req, res) => {
  const inmuebles = await inmuebleServicio.obtenerDestacados();
  res.json({ exito: true, inmuebles });
});

const tiposDisponibles = asyncHandler(async (req, res) => {
  res.json({ exito: true, tipos: Inmueble.TIPOS, modalidades: Inmueble.MODALIDADES });
});

const detalle = asyncHandler(async (req, res) => {
  const { inmueble, imagenes } = await inmuebleServicio.obtenerDetalle(req.params.id);
  res.json({ exito: true, inmueble, imagenes });
});

const crear = asyncHandler(async (req, res) => {
  const inmueble = await inmuebleServicio.crear(req.body, req.usuario._id);
  res.status(201).json({ exito: true, inmueble });
});

const actualizar = asyncHandler(async (req, res) => {
  const inmueble = await inmuebleServicio.actualizar(req.params.id, req.body);
  res.json({ exito: true, inmueble });
});

const eliminar = asyncHandler(async (req, res) => {
  await inmuebleServicio.eliminar(req.params.id);
  res.json({ exito: true, mensaje: 'Inmueble eliminado correctamente' });
});

const agregarImagen = asyncHandler(async (req, res) => {
  const imagen = await inmuebleServicio.agregarImagen(req.params.id, req.file);
  res.status(201).json({ exito: true, imagen });
});

const establecerPrincipal = asyncHandler(async (req, res) => {
  const imagen = await inmuebleServicio.establecerPrincipal(req.params.id, req.params.imagenId);
  res.json({ exito: true, imagen });
});

const eliminarImagen = asyncHandler(async (req, res) => {
  await inmuebleServicio.eliminarImagen(req.params.id, req.params.imagenId);
  res.json({ exito: true, mensaje: 'Imagen eliminada correctamente' });
});

module.exports = {
  listar,
  destacados,
  tiposDisponibles,
  detalle,
  crear,
  actualizar,
  eliminar,
  agregarImagen,
  establecerPrincipal,
  eliminarImagen,
};
