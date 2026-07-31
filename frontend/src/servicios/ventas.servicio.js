import api from './api';

export function inmueblesDisponibles() {
  return api.get('/ventas/inmuebles-disponibles').then((r) => r.data);
}

export function clientesActivos() {
  return api.get('/ventas/clientes').then((r) => r.data);
}

export function registrar(datos) {
  return api.post('/ventas', datos).then((r) => r.data);
}

export function misVentas() {
  return api.get('/ventas/mias').then((r) => r.data);
}

export function listarTodas() {
  return api.get('/ventas').then((r) => r.data);
}

export function misCompras() {
  return api.get('/ventas/mis-compras').then((r) => r.data);
}

export function detalle(id) {
  return api.get(`/ventas/${id}`).then((r) => r.data);
}

export function subirEscritura(id, archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  return api.post(`/ventas/${id}/escritura`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
}

export function cambiarEstado(id, estado) {
  return api.patch(`/ventas/${id}/estado`, { estado }).then((r) => r.data);
}

export function urlDescargaEscritura(id) {
  return `${api.defaults.baseURL}/ventas/${id}/escritura`;
}
