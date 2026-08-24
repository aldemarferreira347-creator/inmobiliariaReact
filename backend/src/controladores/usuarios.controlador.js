const asyncHandler = require('../utilidades/asyncHandler');
const ApiError = require('../utilidades/ApiError');
const usuarioServicio = require('../servicios/usuarioServicio');
const almacenamientoServicio = require('../servicios/almacenamientoServicio');
const { usuarioPublico } = require('./auth.controlador');

const actualizarPerfil = asyncHandler(async (req, res) => {
  const usuario = await usuarioServicio.actualizarPerfil(req.usuario._id, req.body);
  res.json({ exito: true, usuario: usuarioPublico(usuario) });
});

const subirFotoPerfil = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No se recibio ninguna imagen');

  const anterior = req.usuario.fotoPerfilUrl;
  const url = await almacenamientoServicio.guardarFotoPerfil(req.file, req.usuario._id);

  req.usuario.fotoPerfilUrl = url;
  await req.usuario.save();

  await almacenamientoServicio.eliminarArchivoSiExiste(anterior);

  res.json({ exito: true, usuario: usuarioPublico(req.usuario) });
});

const eliminarFotoPerfil = asyncHandler(async (req, res) => {
  const anterior = req.usuario.fotoPerfilUrl;
  if (!anterior) throw ApiError.badRequest('No tienes una foto de perfil para eliminar');

  req.usuario.fotoPerfilUrl = null;
  await req.usuario.save();

  await almacenamientoServicio.eliminarArchivoSiExiste(anterior);

  res.json({ exito: true, usuario: usuarioPublico(req.usuario) });
});

const solicitarCambioContrasena = asyncHandler(async (req, res) => {
  await usuarioServicio.solicitarCambioContrasena(req.usuario._id, req.body);
  res.json({
    exito: true,
    mensaje: 'Validacion exitosa. Revisa tu correo para confirmar el cambio de contrasena.',
  });
});

// --- Administracion (HU-16, HU-26) ---

const listar = asyncHandler(async (req, res) => {
  const usuarios = await usuarioServicio.listarUsuarios({ rol: req.query.rol });
  res.json({ exito: true, usuarios: usuarios.map(usuarioPublico) });
});

const crearConRol = asyncHandler(async (req, res) => {
  const usuario = await usuarioServicio.crearConRol(req.body);
  res.status(201).json({ exito: true, usuario: usuarioPublico(usuario) });
});

const actualizarUsuarioAdmin = asyncHandler(async (req, res) => {
  const usuario = await usuarioServicio.actualizarUsuarioComoAdmin(req.params.id, req.body);
  res.json({ exito: true, usuario: usuarioPublico(usuario) });
});

const cambiarRol = asyncHandler(async (req, res) => {
  const usuario = await usuarioServicio.cambiarRol(req.params.id, req.body.rol, req.usuario);
  res.json({ exito: true, usuario: usuarioPublico(usuario) });
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const usuario = await usuarioServicio.cambiarEstado(req.params.id, req.body.estado, req.usuario);
  res.json({ exito: true, usuario: usuarioPublico(usuario) });
});

const eliminar = asyncHandler(async (req, res) => {
  await usuarioServicio.eliminarUsuario(req.params.id, req.usuario);
  res.json({ exito: true, mensaje: 'Usuario desactivado correctamente' });
});

module.exports = {
  actualizarPerfil,
  subirFotoPerfil,
  eliminarFotoPerfil,
  solicitarCambioContrasena,
  listar,
  crearConRol,
  actualizarUsuarioAdmin,
  cambiarRol,
  cambiarEstado,
  eliminar,
};
