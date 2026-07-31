const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const entorno = require('../configuracion/entorno');

function generarAccessToken(usuario) {
  return jwt.sign(
    { sub: usuario._id.toString(), rol: usuario.rol, tokenVersion: usuario.tokenVersion },
    entorno.jwt.secretoAcceso,
    { expiresIn: entorno.jwt.expiracionAcceso }
  );
}

function generarRefreshToken(usuario) {
  return jwt.sign(
    { sub: usuario._id.toString(), tokenVersion: usuario.tokenVersion },
    entorno.jwt.secretoRefresco,
    { expiresIn: entorno.jwt.expiracionRefresco }
  );
}

function verificarAccessToken(token) {
  return jwt.verify(token, entorno.jwt.secretoAcceso);
}

function verificarRefreshToken(token) {
  return jwt.verify(token, entorno.jwt.secretoRefresco);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const COOKIE_ACCESO = 'accessToken';
const COOKIE_REFRESCO = 'refreshToken';

function opcionesCookieAcceso() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: entorno.esProduccion,
    path: '/',
    maxAge: 15 * 60 * 1000,
  };
}

function opcionesCookieRefresco() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: entorno.esProduccion,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function establecerCookiesSesion(res, accessToken, refreshToken) {
  res.cookie(COOKIE_ACCESO, accessToken, opcionesCookieAcceso());
  res.cookie(COOKIE_REFRESCO, refreshToken, opcionesCookieRefresco());
}

function limpiarCookiesSesion(res) {
  res.clearCookie(COOKIE_ACCESO, { path: '/' });
  res.clearCookie(COOKIE_REFRESCO, { path: '/api/auth' });
}

module.exports = {
  generarAccessToken,
  generarRefreshToken,
  verificarAccessToken,
  verificarRefreshToken,
  hashToken,
  establecerCookiesSesion,
  limpiarCookiesSesion,
  COOKIE_ACCESO,
  COOKIE_REFRESCO,
};
