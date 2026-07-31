import api from './api';

export function listar() {
  return api.get('/notificaciones').then((r) => r.data);
}

export function contador() {
  return api.get('/notificaciones/contador').then((r) => r.data);
}

export function marcarUna(id) {
  return api.patch(`/notificaciones/${id}/leida`).then((r) => r.data);
}

export function marcarTodas() {
  return api.patch('/notificaciones/leer-todas').then((r) => r.data);
}

export function enviarBroadcast(datos) {
  return api.post('/notificaciones/admin/enviar', datos).then((r) => r.data);
}
