import api from './api';

export function obtener() {
  return api.get('/estadisticas').then((r) => r.data);
}
