const PDFDocument = require('pdfkit');

const NAVY = '#0F1E4A';
const GOLD = '#F5A623';
const MARGEN = 50;
const ANCHO_PAGINA = 595.28 - MARGEN * 2; // A4 portrait en puntos

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);
}

function formatoFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString('es-CO') : '';
}

function encabezadoPagina(doc, resumen) {
  doc.fontSize(16).fillColor(NAVY).text('Garcia Inmobiliaria', MARGEN, 40);
  doc.fontSize(10).fillColor('black').text('Reporte administrativo', { align: 'left' });
  doc.text(`Periodo: ${resumen.periodo} (${formatoFecha(resumen.rango.desde)} - ${formatoFecha(resumen.rango.hasta)})`);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`);
  doc.moveDown();
  doc.moveTo(MARGEN, doc.y).lineTo(MARGEN + ANCHO_PAGINA, doc.y).strokeColor(GOLD).lineWidth(2).stroke();
  doc.moveDown();
}

function agregarSeccion(doc, numero, titulo) {
  if (doc.y > 680) doc.addPage();
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(NAVY).text(`${numero}. ${titulo}`);
  doc.fontSize(10).fillColor('black');
  doc.moveDown(0.3);
}

function agregarKpis(doc, kpis) {
  kpis.forEach(([etiqueta, valor]) => {
    doc.text(`${etiqueta}: ${valor}`);
  });
  doc.moveDown(0.5);
}

// pdfkit no trae soporte de tablas nativo (a diferencia de dompdf/HTML+CSS que usaba el PHP
// original) - se dibuja una tabla simple por columnas fijas, suficiente para los listados de este
// reporte.
function agregarTabla(doc, columnas, anchos, filas) {
  let y = doc.y;
  const x = MARGEN;

  const dibujarFila = (valores, negrita) => {
    doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    let offsetX = x;
    valores.forEach((valor, i) => {
      doc.text(String(valor ?? ''), offsetX, y, { width: anchos[i], ellipsis: true });
      offsetX += anchos[i];
    });
  };

  dibujarFila(columnas, true);
  y += 16;
  doc.moveTo(x, y - 4).lineTo(x + anchos.reduce((a, b) => a + b, 0), y - 4).strokeColor(GOLD).lineWidth(1).stroke();

  if (filas.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(9).text('No hay registros disponibles', x, y);
    doc.y = y + 16;
    return;
  }

  filas.forEach((fila) => {
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
    dibujarFila(fila, false);
    y += 15;
  });

  doc.y = y + 10;
}

function generarPdf(resumen) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGEN, bufferPages: true });
    const partes = [];
    doc.on('data', (chunk) => partes.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    encabezadoPagina(doc, resumen);

    agregarSeccion(doc, '01', 'Resumen de Inmuebles');
    agregarKpis(doc, [
      ['Total inmuebles', resumen.inmuebles.total],
      ['Publicados en periodo', resumen.inmuebles.publicadosEnPeriodo],
      ['Disponibles', resumen.inmuebles.disponibles],
      ['Tipos distintos', resumen.inmuebles.porTipo.length],
    ]);

    agregarSeccion(doc, '02', 'Resumen de Reservas');
    agregarKpis(doc, [
      ['Total', resumen.reservas.total],
      ['Confirmadas', resumen.reservas.confirmadas],
      ['Pendientes de pago', resumen.reservas.pendientes],
      ['Canceladas', resumen.reservas.canceladas],
    ]);

    agregarSeccion(doc, '03', 'Resumen de Clientes');
    agregarKpis(doc, [
      ['Total', resumen.clientes.total],
      ['Nuevos en el periodo', resumen.clientes.nuevosEnPeriodo],
      ['Con reservas activas', resumen.clientes.conReservasActivas],
    ]);

    agregarSeccion(doc, '04', 'Resumen Financiero');
    agregarKpis(doc, [
      ['Total recaudado', formatoMoneda(resumen.financiero.totalRecaudado)],
      ['Ventas cerradas', resumen.financiero.totalVentas],
      ['Arrendamientos confirmados', resumen.financiero.totalArrendamientos],
      ['Pagos rechazados', resumen.financiero.pagosRechazados],
    ]);

    doc.addPage();
    agregarSeccion(doc, '05', 'Listado Detallado de Reservaciones');
    agregarTabla(
      doc,
      ['Codigo', 'Fecha', 'Inmueble', 'Cliente', 'Monto', 'Estado'],
      [70, 60, 130, 110, 80, 65],
      resumen.reservas.listado.map((r) => [r.codigo, formatoFecha(r.fecha), r.inmueble, r.cliente, formatoMoneda(r.monto), r.estado])
    );

    // Secciones 06-08: a diferencia del PDF del sistema PHP original (que solo mostraba conteos
    // agregados para pagos/contratos/ventas), aqui se incluye tambien el listado detallado de cada
    // uno - cierra una inconsistencia que el propio PHP tenia entre su version Excel (completa) y
    // su version PDF (solo KPIs) para estas 3 secciones exigidas por HU-21.1/21.2/21.3.
    agregarSeccion(doc, '06', 'Pagos');
    agregarTabla(
      doc,
      ['Reserva', 'Cliente', 'Monto', 'Estado', 'Fecha'],
      [90, 130, 90, 90, 90],
      resumen.listadoPagos.map((p) => [p.codigoReserva, p.cliente, formatoMoneda(p.monto), p.estado, formatoFecha(p.fecha)])
    );

    agregarSeccion(doc, '07', 'Contratos Vigentes');
    agregarTabla(
      doc,
      ['Numero', 'Inmueble', 'Cliente', 'Valor mensual', 'Fecha fin'],
      [90, 120, 110, 90, 80],
      resumen.listadoContratosVigentes.map((c) => [
        c.numeroContrato,
        c.inmueble,
        c.cliente,
        formatoMoneda(c.valorMensual),
        c.fechaFin ? formatoFecha(c.fechaFin) : 'Indefinida',
      ])
    );

    agregarSeccion(doc, '08', 'Ventas');
    agregarTabla(
      doc,
      ['Inmueble', 'Asesor', 'Precio', 'Fecha', 'Estado'],
      [130, 110, 90, 80, 80],
      resumen.listadoVentas.map((v) => [v.inmueble, v.asesor, formatoMoneda(v.precioVenta), formatoFecha(v.fechaVenta), v.estado])
    );

    // Numeracion de paginas.
    const rango = doc.bufferedPageRange();
    for (let i = 0; i < rango.count; i += 1) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('gray').text(`Pagina ${i + 1} de ${rango.count} - Confidencial - Uso Interno`, MARGEN, 800, {
        width: ANCHO_PAGINA,
        align: 'center',
      });
    }

    doc.end();
  });
}

module.exports = { generarPdf };
