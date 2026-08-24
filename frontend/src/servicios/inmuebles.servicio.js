import api from './api';

export function listar(filtros = {}) {
  return api.get('/inmuebles', { params: filtros }).then((r) => r.data);
}

export function destacados() {
  return api.get('/inmuebles/destacados').then((r) => r.data);
}

export function tiposDisponibles() {
  return api.get('/inmuebles/tipos').then((r) => r.data);
}

export function detalle(id) {
  return api.get(`/inmuebles/${id}`).then((r) => r.data);
}

export function estadoActual(id) {
  return api.get(`/inmuebles/${id}/estado`).then((r) => r.data);
}

export function crear(datos) {
  return api.post('/inmuebles', datos).then((r) => r.data);
}

export function actualizar(id, datos) {
  return api.put(`/inmuebles/${id}`, datos).then((r) => r.data);
}

export function eliminar(id) {
  return api.delete(`/inmuebles/${id}`).then((r) => r.data);
}

export function agregarImagen(id, archivo) {
  const formData = new FormData();
  formData.append('imagen', archivo);
  return api.post(`/inmuebles/${id}/imagenes`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
}

export function establecerImagenPrincipal(id, imagenId) {
  return api.patch(`/inmuebles/${id}/imagenes/${imagenId}/principal`).then((r) => r.data);
}

export function eliminarImagen(id, imagenId) {
  return api.delete(`/inmuebles/${id}/imagenes/${imagenId}`).then((r) => r.data);
}
