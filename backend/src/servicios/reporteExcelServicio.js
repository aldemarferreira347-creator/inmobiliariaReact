const ExcelJS = require('exceljs');

const NAVY = 'FF0F1E4A';
const GOLD = 'FFF5A623';

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);
}

function estiloTitulo(hoja, texto, columnas) {
  hoja.mergeCells(1, 1, 1, columnas);
  const celda = hoja.getCell(1, 1);
  celda.value = `Garcia Inmobiliaria - ${texto}`;
  celda.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  celda.alignment = { vertical: 'middle' };
  hoja.getRow(1).height = 24;
}

function estiloEncabezado(fila) {
  fila.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    celda.border = { bottom: { style: 'medium', color: { argb: GOLD } } };
  });
}

function autoajustarColumnas(hoja) {
  hoja.columns.forEach((columna) => {
    let maximo = 10;
    columna.eachCell?.({ includeEmpty: true }, (celda) => {
      const largo = celda.value ? String(celda.value).length : 0;
      if (largo > maximo) maximo = largo;
    });
    columna.width = Math.min(maximo + 2, 40);
  });
}

function construirHojaResumen(workbook, resumen) {
  const hoja = workbook.addWorksheet('Resumen Ejecutivo', { pageSetup: { paperSize: 9, orientation: 'portrait' } });
  estiloTitulo(hoja, 'Resumen Ejecutivo', 2);

  const filas = [
    ['Total Inmuebles', resumen.inmuebles.total],
    ['Inmuebles Disponibles', resumen.inmuebles.disponibles],
    ['Total Reservas', resumen.reservas.total],
    ['Reservas Confirmadas', resumen.reservas.confirmadas],
    ['Total Clientes', resumen.clientes.total],
    ['Nuevos Clientes (periodo)', resumen.clientes.nuevosEnPeriodo],
    ['Total Recaudado', formatoMoneda(resumen.financiero.totalRecaudado)],
    ['Pagos Rechazados', resumen.financiero.pagosRechazados],
  ];

  hoja.addRow([]);
  filas.forEach(([etiqueta, valor]) => hoja.addRow([etiqueta, valor]));
  hoja.getColumn(1).width = 30;
  hoja.getColumn(2).width = 20;
  hoja.getColumn(1).font = { bold: true };
}

function construirHojaReservas(workbook, resumen) {
  const hoja = workbook.addWorksheet('Detalle de Reservas', { pageSetup: { paperSize: 9, orientation: 'landscape' } });
  estiloTitulo(hoja, 'Detalle de Reservas', 6);
  hoja.addRow([]);
  const encabezado = hoja.addRow(['Codigo', 'Fecha', 'Inmueble', 'Cliente', 'Monto (COP)', 'Estado']);
  estiloEncabezado(encabezado);
  hoja.views = [{ state: 'frozen', ySplit: 3 }];

  resumen.reservas.listado.forEach((r) => {
    hoja.addRow([r.codigo, new Date(r.fecha).toLocaleDateString('es-CO'), r.inmueble, r.cliente, r.monto, r.estado]);
  });

  if (resumen.reservas.listado.length === 0) {
    hoja.addRow(['No hay registros disponibles']);
  } else {
    const totalRecaudado = resumen.reservas.listado
      .filter((r) => r.estado === 'CONFIRMADA')
      .reduce((acc, r) => acc + r.monto, 0);
    hoja.addRow(['', '', '', '', totalRecaudado, 'TOTAL RECAUDADO']);
  }

  hoja.autoFilter = { from: 'A3', to: 'F3' };
  autoajustarColumnas(hoja);
}

function construirHojaTabla(workbook, nombre, columnas, filas) {
  const hoja = workbook.addWorksheet(nombre, { pageSetup: { paperSize: 9, orientation: 'landscape' } });
  estiloTitulo(hoja, nombre, columnas.length);
  hoja.addRow([]);
  const encabezado = hoja.addRow(columnas);
  estiloEncabezado(encabezado);
  hoja.views = [{ state: 'frozen', ySplit: 3 }];

  if (filas.length === 0) {
    hoja.addRow(['No hay registros disponibles']);
  } else {
    filas.forEach((fila) => hoja.addRow(fila));
  }

  hoja.autoFilter = { from: 'A3', to: `${String.fromCharCode(64 + columnas.length)}3` };
  autoajustarColumnas(hoja);
}

async function generarExcel(resumen) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Garcia Inmobiliaria';
  workbook.created = new Date();

  construirHojaResumen(workbook, resumen);
  construirHojaReservas(workbook, resumen);

  construirHojaTabla(
    workbook,
    'Pagos',
    ['Reserva', 'Cliente', 'Monto', 'Estado', 'Fecha'],
    resumen.listadoPagos.map((p) => [p.codigoReserva, p.cliente, p.monto, p.estado, new Date(p.fecha).toLocaleDateString('es-CO')])
  );

  construirHojaTabla(
    workbook,
    'Contratos Vigentes',
    ['Numero de contrato', 'Inmueble', 'Cliente', 'Valor mensual', 'Fecha fin'],
    resumen.listadoContratosVigentes.map((c) => [
      c.numeroContrato,
      c.inmueble,
      c.cliente,
      c.valorMensual,
      c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-CO') : 'Indefinida',
    ])
  );

  construirHojaTabla(
    workbook,
    'Ventas',
    ['Inmueble', 'Asesor', 'Precio total', 'Fecha', 'Estado'],
    resumen.listadoVentas.map((v) => [v.inmueble, v.asesor, v.precioVenta, new Date(v.fechaVenta).toLocaleDateString('es-CO'), v.estado])
  );

  workbook.views = [{ activeTab: 0 }];

  return workbook.xlsx.writeBuffer();
}

module.exports = { generarExcel };
