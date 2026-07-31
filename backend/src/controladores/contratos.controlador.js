const path = require('path');
const asyncHandler = require('../utilidades/asyncHandler');
const contratoServicio = require('../servicios/contratoServicio');

const reservasDisponibles = asyncHandler(async (req, res) => {
  const reservas = await contratoServicio.obtenerReservasConfirmadasSinContrato();
  res.json({ exito: true, reservas });
});

const listar = asyncHandler(async (req, res) => {
  const contratos = await contratoServicio.listar();
  res.json({ exito: true, contratos });
});

const detalle = asyncHandler(async (req, res) => {
  const contrato = await contratoServicio.obtenerDetalle(req.params.id);
  res.json({ exito: true, contrato });
});

const crear = asyncHandler(async (req, res) => {
  const contrato = await contratoServicio.crearDesdeReserva(req.body.reservaId, req.body);
  res.status(201).json({ exito: true, contrato });
});

const subirArchivo = asyncHandler(async (req, res) => {
  const contrato = await contratoServicio.subirArchivo(req.params.id, req.file);
  res.json({ exito: true, contrato });
});

const rescindir = asyncHandler(async (req, res) => {
  const contrato = await contratoServicio.rescindir(req.params.id);
  res.json({ exito: true, contrato });
});

// Descarga autenticada (ownership verificado en el servicio) - el PDF nunca se sirve via /uploads
// publico, ya que es un documento legal/sensible.
const descargar = asyncHandler(async (req, res) => {
  const rutaRelativa = await contratoServicio.obtenerRutaArchivoParaUsuario(req.params.id, req.usuario);
  res.sendFile(path.resolve(rutaRelativa));
});

const misArriendos = asyncHandler(async (req, res) => {
  const arriendos = await contratoServicio.obtenerHistorialArriendosCliente(req.usuario._id);
  res.json({ exito: true, arriendos });
});

const marcarVencidosManual = asyncHandler(async (req, res) => {
  const totalVencidos = await contratoServicio.marcarVencidos();
  res.json({ exito: true, totalVencidos });
});

module.exports = {
  reservasDisponibles,
  listar,
  detalle,
  crear,
  subirArchivo,
  rescindir,
  descargar,
  misArriendos,
  marcarVencidosManual,
};
