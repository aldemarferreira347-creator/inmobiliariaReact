const entorno = require('../configuracion/entorno');

// Solo confia en X-Forwarded-For si la peticion viene de un proxy explicitamente configurado,
// igual que LoginAttempt::obtenerIpReal del PHP original (evita que un cliente falsifique su IP).
function obtenerIpReal(req) {
  const ipDirecta = req.socket.remoteAddress || req.ip;

  if (entorno.proxyConfiable && ipDirecta === entorno.proxyConfiable) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
  }

  return ipDirecta;
}

module.exports = { obtenerIpReal };
