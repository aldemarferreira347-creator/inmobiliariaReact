import api from './api';

export function iniciar(inmuebleId) {
  return api.post('/reservas', { inmuebleId }).then((r) => r.data);
}

export function misReservas() {
  return api.get('/reservas/mias').then((r) => r.data);
}

export function detalle(id) {
  return api.get(`/reservas/${id}`).then((r) => r.data);
}

export function pagar(id, metodoPagoGuardadoId) {
  return api.post(`/reservas/${id}/pagar`, metodoPagoGuardadoId ? { metodoPagoGuardadoId } : {}).then((r) => r.data);
}

export function cancelarPropia(id) {
  return api.patch(`/reservas/${id}/cancelar`).then((r) => r.data);
}

export function listarTodas() {
  return api.get('/reservas').then((r) => r.data);
}

export function cancelarAdmin(id) {
  return api.patch(`/reservas/${id}/cancelar-admin`).then((r) => r.data);
}

export function expirarVencidasManual() {
  return api.post('/reservas/admin/expirar-vencidas').then((r) => r.data);
}
