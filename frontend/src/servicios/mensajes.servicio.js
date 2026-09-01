import api from './api';

export function conversaciones() {
  return api.get('/mensajes/conversaciones').then((r) => r.data);
}

export function hilo(otroId, params = {}) {
  return api.get(`/mensajes/hilo/${otroId}`, { params }).then((r) => r.data);
}

export function nuevosDesde(otroId, desde, params = {}) {
  return api.get(`/mensajes/hilo/${otroId}/nuevos`, { params: { desde, ...params } }).then((r) => r.data);
}

export function marcarLeidos(otroId) {
  return api.post(`/mensajes/hilo/${otroId}/marcar-leidos`).then((r) => r.data);
}

export function enviar(destinatarioId, contenido) {
  return api.post('/mensajes', { destinatarioId, contenido }).then((r) => r.data);
}

export function noLeidosContador() {
  return api.get('/mensajes/no-leidos/contador').then((r) => r.data);
}

export function enviarContacto({ mensaje, inmuebleId }) {
  return api.post('/mensajes/contacto', { mensaje, inmuebleId }).then((r) => r.data);
}
