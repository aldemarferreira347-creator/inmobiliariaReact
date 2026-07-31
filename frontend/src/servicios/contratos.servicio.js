import api from './api';

export function reservasDisponibles() {
  return api.get('/contratos/reservas-disponibles').then((r) => r.data);
}

export function listar() {
  return api.get('/contratos').then((r) => r.data);
}

export function detalle(id) {
  return api.get(`/contratos/${id}`).then((r) => r.data);
}

export function crear(datos) {
  return api.post('/contratos', datos).then((r) => r.data);
}

export function subirArchivo(id, archivo) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  return api.post(`/contratos/${id}/archivo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
}

export function rescindir(id) {
  return api.patch(`/contratos/${id}/rescindir`).then((r) => r.data);
}

export function misArriendos() {
  return api.get('/contratos/mis-arriendos').then((r) => r.data);
}

export function marcarVencidosManual() {
  return api.post('/contratos/admin/marcar-vencidos').then((r) => r.data);
}

export function urlDescarga(id) {
  return `${api.defaults.baseURL}/contratos/${id}/descargar`;
}
