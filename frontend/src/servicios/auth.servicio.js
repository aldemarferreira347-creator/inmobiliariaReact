import api from './api';

export function registrar(datos) {
  return api.post('/auth/registro', datos).then((r) => r.data);
}

export function login(credenciales) {
  return api.post('/auth/login', credenciales).then((r) => r.data);
}

export function logout() {
  return api.post('/auth/logout').then((r) => r.data);
}

export function obtenerPerfil() {
  return api.get('/auth/perfil').then((r) => r.data);
}

export function recuperarPassword(correo) {
  return api.post('/auth/recuperar-password', { correo }).then((r) => r.data);
}

export function resetearPassword(token, contrasenaNueva) {
  return api.post(`/auth/resetear-password/${token}`, { contrasenaNueva }).then((r) => r.data);
}

export function confirmarCambioPassword(token) {
  return api.post(`/auth/confirmar-cambio-password/${token}`).then((r) => r.data);
}
