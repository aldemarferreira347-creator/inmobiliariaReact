import api from './api';

export function franjasDisponibles(fecha) {
  return api.get('/citas/franjas-disponibles', { params: { fecha } }).then((r) => r.data);
}

export function solicitar(datos) {
  return api.post('/citas', datos).then((r) => r.data);
}

export function misCitas() {
  return api.get('/citas/mias').then((r) => r.data);
}

export function cancelarPropia(id) {
  return api.patch(`/citas/${id}/cancelar`).then((r) => r.data);
}

export function citasDeAsesor(estado) {
  return api.get('/citas/asesor/mias', { params: estado ? { estado } : {} }).then((r) => r.data);
}

export function registrarObservacion(id, contenido) {
  return api.post(`/citas/${id}/observacion`, { contenido }).then((r) => r.data);
}

export function detalle(id) {
  return api.get(`/citas/${id}`).then((r) => r.data);
}

export function sinAsignar() {
  return api.get('/citas/sin-asignar').then((r) => r.data);
}

export function agrupadasPorAsesor() {
  return api.get('/citas/agrupadas-por-asesor').then((r) => r.data);
}

export function asesoresDisponibles() {
  return api.get('/citas/asesores-disponibles').then((r) => r.data);
}

export function asignar(id, asesorId) {
  return api.patch(`/citas/${id}/asignar`, { asesorId }).then((r) => r.data);
}

export function listarFranjas() {
  return api.get('/franjas').then((r) => r.data);
}

export function guardarFranja(datos) {
  return api.put('/franjas', datos).then((r) => r.data);
}
