const path = require('path');
const asyncHandler = require('../utilidades/asyncHandler');
const ventaServicio = require('../servicios/ventaServicio');
const { ROLES } = require('../utilidades/constantes');

const inmueblesDisponibles = asyncHandler(async (req, res) => {
  const inmuebles = await ventaServicio.obtenerInmueblesDisponiblesParaVenta();
  res.json({ exito: true, inmuebles });
});

const clientesActivos = asyncHandler(async (req, res) => {
  const clientes = await ventaServicio.obtenerClientesActivos();
  res.json({ exito: true, clientes });
});

const registrar = asyncHandler(async (req, res) => {
  const { inmuebleId, clienteId, precioVenta, fechaVenta, notaria } = req.body;
  const venta = await ventaServicio.registrar(inmuebleId, clienteId, req.usuario._id, { precioVenta, fechaVenta, notaria });
  res.status(201).json({ exito: true, venta });
});

const misVentas = asyncHandler(async (req, res) => {
  const ventas = await ventaServicio.listarPorAsesor(req.usuario._id);
  res.json({ exito: true, ventas });
});

const listarTodas = asyncHandler(async (req, res) => {
  const ventas = await ventaServicio.listarTodas();
  res.json({ exito: true, ventas });
});

const misCompras = asyncHandler(async (req, res) => {
  const ventas = await ventaServicio.listarPorCliente(req.usuario._id);
  res.json({ exito: true, ventas });
});

const detalle = asyncHandler(async (req, res) => {
  const venta = await ventaServicio.obtenerDetalle(req.params.id);

  const esAdmin = req.usuario.rol === ROLES.ADMINISTRADOR;
  const esAsesorPropietario = venta.asesor && String(venta.asesor._id) === String(req.usuario._id);
  const esClientePropietario = String(venta.cliente._id) === String(req.usuario._id);
  if (!esAdmin && !esAsesorPropietario && !esClientePropietario) {
    return res.status(403).json({ exito: false, mensaje: 'No tienes acceso a esta venta' });
  }

  return res.json({ exito: true, venta });
});

const subirEscritura = asyncHandler(async (req, res) => {
  const venta = await ventaServicio.subirEscritura(req.params.id, req.file);
  res.json({ exito: true, venta });
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const venta = await ventaServicio.cambiarEstado(req.params.id, req.body.estado);
  res.json({ exito: true, venta });
});

const descargarEscritura = asyncHandler(async (req, res) => {
  const rutaRelativa = await ventaServicio.obtenerRutaArchivoParaUsuario(req.params.id, req.usuario);
  res.sendFile(path.resolve(rutaRelativa));
});

module.exports = {
  inmueblesDisponibles,
  clientesActivos,
  registrar,
  misVentas,
  listarTodas,
  misCompras,
  detalle,
  subirEscritura,
  cambiarEstado,
  descargarEscritura,
};
