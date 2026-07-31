import api from './api';

export function crearSetupIntent() {
  return api.post('/tarjetas/setup-intent').then((r) => r.data);
}

export function guardar(paymentMethodId) {
  return api.post('/tarjetas', { paymentMethodId }).then((r) => r.data);
}

export function listar() {
  return api.get('/tarjetas').then((r) => r.data);
}

export function eliminar(id) {
  return api.delete(`/tarjetas/${id}`).then((r) => r.data);
}
