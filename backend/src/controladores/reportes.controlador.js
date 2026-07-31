const asyncHandler = require('../utilidades/asyncHandler');
const reporteServicio = require('../servicios/reporteServicio');
const reporteExcelServicio = require('../servicios/reporteExcelServicio');
const reportePdfServicio = require('../servicios/reportePdfServicio');

function nombreArchivo(extension) {
  const marca = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  return `reporte_inmobiliaria_${marca}.${extension}`;
}

const datos = asyncHandler(async (req, res) => {
  const resumen = await reporteServicio.obtenerResumen(req.query);
  res.json({ exito: true, resumen });
});

// Se genera y transmite en el mismo request (sin archivo intermedio), igual que el PHP original.
const exportarExcel = asyncHandler(async (req, res) => {
  const resumen = await reporteServicio.obtenerResumen(req.query);
  const buffer = await reporteExcelServicio.generarExcel(resumen);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('xlsx')}"`);
  res.send(buffer);
});

const exportarPdf = asyncHandler(async (req, res) => {
  const resumen = await reporteServicio.obtenerResumen(req.query);
  const buffer = await reportePdfServicio.generarPdf(resumen);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('pdf')}"`);
  res.send(buffer);
});

module.exports = { datos, exportarExcel, exportarPdf };
