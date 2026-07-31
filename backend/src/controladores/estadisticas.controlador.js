const asyncHandler = require('../utilidades/asyncHandler');
const homeStatsServicio = require('../servicios/homeStatsServicio');

const obtener = asyncHandler(async (req, res) => {
  const estadisticas = await homeStatsServicio.obtenerEstadisticas();
  res.json({ exito: true, estadisticas });
});

module.exports = { obtener };
