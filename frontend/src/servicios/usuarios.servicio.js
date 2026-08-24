import api from './api';

export function actualizarPerfil(datos) {
  return api.put('/usuarios/perfil', datos).then((r) => r.data);
}

export function subirFotoPerfil(archivo) {
  const formData = new FormData();
  formData.append('foto', archivo);
  return api.post('/usuarios/perfil/foto', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
}

export function solicitarCambioContrasena(datos) {
  return api.post('/usuarios/perfil/solicitar-cambio-contrasena', datos).then((r) => r.data);
}

export function eliminarFotoPerfil() {
  return api.delete('/usuarios/perfil/foto').then((r) => r.data);
}

export function listarUsuarios(rol) {
  return api.get('/usuarios', { params: rol ? { rol } : {} }).then((r) => r.data);
}

export function crearConRol(datos) {
  return api.post('/usuarios', datos).then((r) => r.data);
}

export function actualizarUsuarioAdmin(id, datos) {
  return api.patch(`/usuarios/${id}`, datos).then((r) => r.data);
}

export function cambiarRol(id, rol) {
  return api.patch(`/usuarios/${id}/rol`, { rol }).then((r) => r.data);
}

export function cambiarEstado(id, estado) {
  return api.patch(`/usuarios/${id}/estado`, { estado }).then((r) => r.data);
}

export function eliminarUsuario(id) {
  return api.delete(`/usuarios/${id}`).then((r) => r.data);
}
