const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Usuario = require('../modelos/Usuario');
const LoginAttempt = require('../modelos/LoginAttempt');
const PasswordReset = require('../modelos/PasswordReset');
const ApiError = require('../utilidades/ApiError');
const { ROLES, ESTADOS_USUARIO } = require('../utilidades/constantes');
const { hashToken } = require('./tokenServicio');
const correoServicio = require('./correoServicio');

const RONDAS_BCRYPT = 12;
const MAX_INTENTOS = 5;
const VENTANA_BLOQUEO_MS = 60 * 60 * 1000; // 1 hora, igual que LoginAttempt.php

// Politica de contrasena fuerte: unica fuente de verdad reutilizada en registro, cambio y
// recuperacion, igual que helpers/validation.php del sistema original.
const REGEX_PASSWORD_FUERTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function contrasenaEsSegura(contrasena) {
  return typeof contrasena === 'string' && REGEX_PASSWORD_FUERTE.test(contrasena);
}

function esperarDelayAntiTiming() {
  const ms = 100 + Math.floor(Math.random() * 300);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function registrar({ nombre, correo, contrasena, telefono, documento_tipo, documento_numero, fecha_nacimiento, ciudad, direccion }) {
  const existente = await Usuario.findOne({ correo: correo.toLowerCase() });
  if (existente) {
    throw ApiError.conflicto('Ya existe una cuenta registrada con este correo');
  }

  if (!contrasenaEsSegura(contrasena)) {
    throw ApiError.badRequest(
      'La contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y caracter especial'
    );
  }

  const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  const usuario = await Usuario.create({
    nombre,
    correo: correo.toLowerCase(),
    contrasenaHash,
    telefono,
    ciudad,
    direccion,
    rol: ROLES.CLIENTE,
    perfilCliente: {
      documentoTipo: documento_tipo,
      documentoNumero: documento_numero,
      fechaNacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined
    }
  });

  await correoServicio.enviarConfirmacionRegistro(usuario);

  return usuario;
}

async function registrarIntento({ correo, ip, exitoso }) {
  await LoginAttempt.create({ correo: correo.toLowerCase(), ip, exitoso });
}

async function estaBloqueadoPorIntentos({ correo, ip }) {
  const desde = new Date(Date.now() - VENTANA_BLOQUEO_MS);
  const fallidos = await LoginAttempt.countDocuments({
    correo: correo.toLowerCase(),
    ip,
    exitoso: false,
    fecha: { $gte: desde },
  });
  return fallidos >= MAX_INTENTOS;
}

async function verificarCredenciales({ correo, contrasena, ip }) {
  if (await estaBloqueadoPorIntentos({ correo, ip })) {
    throw ApiError.prohibido('Demasiados intentos fallidos. Intenta de nuevo en una hora.');
  }

  const usuario = await Usuario.findOne({ correo: correo.toLowerCase() }).select('+contrasenaHash');

  // Mensaje generico y delay aleatorio anti-timing-attack, sin distinguir correo inexistente de
  // contrasena incorrecta (igual que AuthController::login del PHP original).
  if (!usuario) {
    await esperarDelayAntiTiming();
    await registrarIntento({ correo, ip, exitoso: false });
    throw ApiError.noAutorizado('Credenciales invalidas');
  }

  const coincide = await bcrypt.compare(contrasena, usuario.contrasenaHash);
  await esperarDelayAntiTiming();

  if (!coincide) {
    await registrarIntento({ correo, ip, exitoso: false });
    throw ApiError.noAutorizado('Credenciales invalidas');
  }

  if (usuario.estado === ESTADOS_USUARIO.INACTIVO) {
    throw ApiError.prohibido('Esta cuenta esta desactivada');
  }

  await registrarIntento({ correo, ip, exitoso: true });

  return usuario;
}

async function actualizarPerfil(usuarioId, { nombre, apellido, telefono, direccion }) {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) throw ApiError.noEncontrado('Usuario no encontrado');

  if (nombre !== undefined) usuario.nombre = nombre;
  if (apellido !== undefined) usuario.apellido = apellido;
  if (telefono !== undefined) usuario.telefono = telefono;
  if (direccion !== undefined) usuario.direccion = direccion;

  await usuario.save();
  return usuario;
}

async function cambiarContrasena(usuarioId, { contrasenaActual, contrasenaNueva }) {
  const usuario = await Usuario.findById(usuarioId).select('+contrasenaHash');
  if (!usuario) throw ApiError.noEncontrado('Usuario no encontrado');

  const coincide = await bcrypt.compare(contrasenaActual, usuario.contrasenaHash);
  if (!coincide) {
    throw ApiError.badRequest('La contrasena actual es incorrecta');
  }

  if (!contrasenaEsSegura(contrasenaNueva)) {
    throw ApiError.badRequest(
      'La contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y caracter especial'
    );
  }

  usuario.contrasenaHash = await bcrypt.hash(contrasenaNueva, RONDAS_BCRYPT);
  usuario.tokenVersion += 1; // invalida cualquier sesion activa previa (equivalente a regenerar sesion)
  await usuario.save();

  await correoServicio.enviarConfirmacionCambioPassword(usuario);

  return usuario;
}

async function solicitarRecuperacion(correo) {
  const usuario = await Usuario.findOne({ correo: correo.toLowerCase() });
  // No revela si el correo existe o no (mismo comportamiento del PHP original), pero solo envia
  // el correo si el usuario existe.
  if (!usuario) return;

  const tokenPlano = crypto.randomBytes(32).toString('hex');
  await PasswordReset.create({
    usuario: usuario._id,
    tokenHash: hashToken(tokenPlano),
    expiraEn: new Date(Date.now() + 60 * 60 * 1000),
  });

  await correoServicio.enviarEnlaceRecuperacion(usuario, tokenPlano);
}

async function restablecerContrasena(tokenPlano, contrasenaNueva) {
  if (!contrasenaEsSegura(contrasenaNueva)) {
    throw ApiError.badRequest(
      'La contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y caracter especial'
    );
  }

  const tokenHash = hashToken(tokenPlano);
  const registro = await PasswordReset.findOne({ tokenHash, usado: false, expiraEn: { $gt: new Date() } });

  if (!registro) {
    throw ApiError.badRequest('El enlace de recuperacion es invalido o expiro');
  }

  const usuario = await Usuario.findById(registro.usuario);
  if (!usuario) throw ApiError.noEncontrado('Usuario no encontrado');

  usuario.contrasenaHash = await bcrypt.hash(contrasenaNueva, RONDAS_BCRYPT);
  usuario.tokenVersion += 1;
  await usuario.save();

  registro.usado = true;
  await registro.save();

  await correoServicio.enviarConfirmacionCambioPassword(usuario);

  return usuario;
}

async function listarUsuarios({ rol } = {}) {
  const filtro = {};
  if (rol) filtro.rol = rol;
  return Usuario.find(filtro).sort({ createdAt: -1 });
}

async function crearConRol({ nombre, apellido, correo, contrasena, telefono, rol }) {
  const existente = await Usuario.findOne({ correo: correo.toLowerCase() });
  if (existente) {
    throw ApiError.conflicto('Ya existe una cuenta registrada con este correo');
  }
  if (!Object.values(ROLES).includes(rol)) {
    throw ApiError.badRequest('Rol invalido');
  }
  if (!contrasenaEsSegura(contrasena)) {
    throw ApiError.badRequest(
      'La contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y caracter especial'
    );
  }

  const contrasenaHash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  return Usuario.create({ nombre, apellido, correo: correo.toLowerCase(), contrasenaHash, telefono, rol });
}

async function cambiarRol(usuarioIdObjetivo, nuevoRol, usuarioQueEjecuta) {
  if (String(usuarioIdObjetivo) === String(usuarioQueEjecuta._id)) {
    throw ApiError.badRequest('No puedes cambiar tu propio rol');
  }
  if (!Object.values(ROLES).includes(nuevoRol)) {
    throw ApiError.badRequest('Rol invalido');
  }

  const usuario = await Usuario.findById(usuarioIdObjetivo);
  if (!usuario) throw ApiError.noEncontrado('Usuario no encontrado');

  usuario.rol = nuevoRol;
  usuario.perfilCliente = undefined;
  usuario.perfilAsesor = undefined;
  usuario.tokenVersion += 1; // el usuario afectado debe reautenticarse con el nuevo rol
  await usuario.save();

  return usuario;
}

async function cambiarEstado(usuarioIdObjetivo, nuevoEstado, usuarioQueEjecuta) {
  if (String(usuarioIdObjetivo) === String(usuarioQueEjecuta._id)) {
    throw ApiError.badRequest('No puedes desactivar tu propia cuenta');
  }
  if (!Object.values(ESTADOS_USUARIO).includes(nuevoEstado)) {
    throw ApiError.badRequest('Estado invalido');
  }

  const usuario = await Usuario.findById(usuarioIdObjetivo);
  if (!usuario) throw ApiError.noEncontrado('Usuario no encontrado');

  usuario.estado = nuevoEstado;
  usuario.tokenVersion += 1;
  await usuario.save();

  return usuario;
}

async function eliminarUsuario(usuarioIdObjetivo, usuarioQueEjecuta) {
  if (String(usuarioIdObjetivo) === String(usuarioQueEjecuta._id)) {
    throw ApiError.badRequest('No puedes eliminar tu propia cuenta');
  }

  const usuario = await Usuario.findById(usuarioIdObjetivo);
  if (!usuario) throw ApiError.noEncontrado('Usuario no encontrado');

  // Igual que el PHP original: no se permite hard-delete, solo desactivar. La eliminacion fisica
  // se bloquea porque otras colecciones (reservas, ventas, etc.) referencian este usuario.
  usuario.estado = ESTADOS_USUARIO.INACTIVO;
  usuario.tokenVersion += 1;
  await usuario.save();

  return usuario;
}

module.exports = {
  contrasenaEsSegura,
  registrar,
  verificarCredenciales,
  actualizarPerfil,
  cambiarContrasena,
  solicitarRecuperacion,
  restablecerContrasena,
  listarUsuarios,
  crearConRol,
  cambiarRol,
  cambiarEstado,
  eliminarUsuario,
};
