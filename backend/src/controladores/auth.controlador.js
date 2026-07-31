const Usuario = require('../modelos/Usuario');
const asyncHandler = require('../utilidades/asyncHandler');
const ApiError = require('../utilidades/ApiError');
const usuarioServicio = require('../servicios/usuarioServicio');
const { obtenerIpReal } = require('../utilidades/ip');
const {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
  hashToken,
  establecerCookiesSesion,
  limpiarCookiesSesion,
  COOKIE_REFRESCO,
} = require('../servicios/tokenServicio');

function usuarioPublico(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    correo: usuario.correo,
    rol: usuario.rol,
    estado: usuario.estado,
    telefono: usuario.telefono,
    direccion: usuario.direccion,
    fotoPerfilUrl: usuario.fotoPerfilUrl,
  };
}

async function emitirSesion(res, usuario) {
  const accessToken = generarAccessToken(usuario);
  const refreshToken = generarRefreshToken(usuario);

  usuario.refreshTokenHash = hashToken(refreshToken);
  usuario.refreshTokenExpiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  usuario.ultimoAcceso = new Date();
  await usuario.save({ validateBeforeSave: false });

  establecerCookiesSesion(res, accessToken, refreshToken);
}

const registro = asyncHandler(async (req, res) => {
  const datos = { ...req.body, correo: req.body.email };
  const usuario = await usuarioServicio.registrar(datos);
  res.status(201).json({ exito: true, usuario: usuarioPublico(usuario) });
});

const login = asyncHandler(async (req, res) => {
  const ip = obtenerIpReal(req);
  const correo = req.body.email;
  const contrasena = req.body.contrasena;
  const usuario = await usuarioServicio.verificarCredenciales({ correo, contrasena, ip });

  await emitirSesion(res, usuario);

  res.json({ exito: true, usuario: usuarioPublico(usuario) });
});

const refrescar = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_REFRESCO];
  if (!token) {
    throw ApiError.noAutorizado('No hay sesion para refrescar');
  }

  let payload;
  try {
    payload = verificarRefreshToken(token);
  } catch (error) {
    limpiarCookiesSesion(res);
    throw ApiError.noAutorizado('Sesion expirada, inicia sesion de nuevo');
  }

  const usuario = await Usuario.findById(payload.sub).select('+refreshTokenHash +refreshTokenExpiraEn');

  if (
    !usuario ||
    usuario.tokenVersion !== payload.tokenVersion ||
    usuario.refreshTokenHash !== hashToken(token) ||
    !usuario.refreshTokenExpiraEn ||
    usuario.refreshTokenExpiraEn < new Date()
  ) {
    limpiarCookiesSesion(res);
    throw ApiError.noAutorizado('Sesion invalida, inicia sesion de nuevo');
  }

  // Timeout de inactividad de 15 min (HU-05): si el ultimo acceso registrado supera ese umbral,
  // se fuerza a re-autenticar aunque el refresh token siga siendo formalmente valido.
  const inactivoDesdeMs = Date.now() - new Date(usuario.ultimoAcceso || 0).getTime();
  if (inactivoDesdeMs > 15 * 60 * 1000) {
    usuario.refreshTokenHash = null;
    usuario.refreshTokenExpiraEn = null;
    await usuario.save({ validateBeforeSave: false });
    limpiarCookiesSesion(res);
    throw ApiError.noAutorizado('Sesion expirada por inactividad');
  }

  await emitirSesion(res, usuario);

  res.json({ exito: true, usuario: usuarioPublico(usuario) });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_REFRESCO];
  if (token) {
    try {
      const payload = verificarRefreshToken(token);
      await Usuario.findByIdAndUpdate(payload.sub, { refreshTokenHash: null, refreshTokenExpiraEn: null });
    } catch (error) {
      // token ya invalido: no hay nada que limpiar en BD, solo se limpian las cookies igual.
    }
  }

  limpiarCookiesSesion(res);
  res.json({ exito: true });
});

const perfil = asyncHandler(async (req, res) => {
  res.json({ exito: true, usuario: usuarioPublico(req.usuario) });
});

const recuperarPassword = asyncHandler(async (req, res) => {
  await usuarioServicio.solicitarRecuperacion(req.body.correo);
  // Respuesta generica siempre exitosa, sin revelar si el correo existe.
  res.json({ exito: true, mensaje: 'Si el correo esta registrado, recibiras un enlace de recuperacion' });
});

const resetearPassword = asyncHandler(async (req, res) => {
  await usuarioServicio.restablecerContrasena(req.params.token, req.body.contrasenaNueva);
  res.json({ exito: true, mensaje: 'Contrasena actualizada correctamente' });
});

module.exports = { registro, login, refrescar, logout, perfil, recuperarPassword, resetearPassword, usuarioPublico };
