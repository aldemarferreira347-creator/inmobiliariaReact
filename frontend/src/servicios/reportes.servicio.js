import api from './api';

export function obtenerDatos(filtros) {
  return api.get('/reportes/datos', { params: filtros }).then((r) => r.data);
}

function construirUrl(ruta, filtros) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros || {}).filter(([, valor]) => valor !== '' && valor != null))
  );
  const query = params.toString();
  return `${api.defaults.baseURL}${ruta}${query ? `?${query}` : ''}`;
}

export function urlExportarExcel(filtros) {
  return construirUrl('/reportes/exportar-excel', filtros);
}

export function urlExportarPdf(filtros) {
  return construirUrl('/reportes/exportar-pdf', filtros);
}
