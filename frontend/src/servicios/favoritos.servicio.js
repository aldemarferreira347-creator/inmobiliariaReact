import api from './api';

export function listar() {
  return api.get('/favoritos').then((r) => r.data);
}

export function alternar(inmuebleId) {
  return api.post(`/favoritos/${inmuebleId}`).then((r) => r.data);
}
