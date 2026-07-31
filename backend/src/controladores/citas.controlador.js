const asyncHandler = require('../utilidades/asyncHandler');
const citaServicio = require('../servicios/citaServicio');
const { ROLES } = require('../utilidades/constantes');

// --- Cliente ---

const franjasDisponibles = asyncHandler(async (req, res) => {
  const resultado = await citaServicio.franjasDisponibles(req.query.fecha);
  res.json({ exito: true, ...resultado });
});

const solicitar = asyncHandler(async (req, res) => {
  const cita = await citaServicio.solicitar(req.usuario._id, req.body);
  res.status(201).json({ exito: true, cita });
});

const misCitas = asyncHandler(async (req, res) => {
  const citas = await citaServicio.misCitas(req.usuario._id);
  res.json({ exito: true, citas });
});

const cancelarPropia = asyncHandler(async (req, res) => {
  const cita = await citaServicio.cancelar(req.params.id, req.usuario._id, true);
  res.json({ exito: true, cita });
});

// --- Asesor ---

const citasDeAsesor = asyncHandler(async (req, res) => {
  const citas = await citaServicio.obtenerCitasDeAsesor(req.usuario._id, req.query.estado);
  res.json({ exito: true, citas });
});

const registrarObservacion = asyncHandler(async (req, res) => {
  const resultado = await citaServicio.registrarObservacion(req.params.id, req.usuario._id, req.body.contenido);
  res.json({ exito: true, ...resultado });
});

// --- Detalle compartido (cliente propietario, asesor asignado o admin) ---

const detalle = asyncHandler(async (req, res) => {
  const resultado = await citaServicio.obtenerDetalleCompleto(req.params.id);
  const { cita } = resultado;

  const esPropietario = String(cita.cliente._id) === String(req.usuario._id);
  const esAsesorAsignado = cita.asesor && String(cita.asesor._id) === String(req.usuario._id);
  const esAdmin = req.usuario.rol === ROLES.ADMINISTRADOR;

  if (!esPropietario && !esAsesorAsignado && !esAdmin) {
    return res.status(403).json({ exito: false, mensaje: 'No tienes acceso a esta cita' });
  }

  return res.json({ exito: true, ...resultado });
});

// --- Admin ---

const sinAsignar = asyncHandler(async (req, res) => {
  const citas = await citaServicio.obtenerCitasSinAsignar();
  res.json({ exito: true, citas });
});

const agrupadasPorAsesor = asyncHandler(async (req, res) => {
  const grupos = await citaServicio.obtenerCitasAgrupadasPorAsesor();
  res.json({ exito: true, grupos });
});

const asesoresDisponibles = asyncHandler(async (req, res) => {
  const asesores = await citaServicio.obtenerAsesoresDisponibles();
  res.json({ exito: true, asesores });
});

const asignar = asyncHandler(async (req, res) => {
  const cita = await citaServicio.asignar(req.params.id, req.body.asesorId, req.usuario);
  res.json({ exito: true, cita });
});

module.exports = {
  franjasDisponibles,
  solicitar,
  misCitas,
  cancelarPropia,
  citasDeAsesor,
  registrarObservacion,
  detalle,
  sinAsignar,
  agrupadasPorAsesor,
  asesoresDisponibles,
  asignar,
};
