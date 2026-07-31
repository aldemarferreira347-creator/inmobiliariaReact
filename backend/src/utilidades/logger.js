const entorno = require('../configuracion/entorno');

function marcaTiempo() {
  return new Date().toISOString();
}

const logger = {
  info(mensaje, extra) {
    console.log(`[${marcaTiempo()}] [INFO] ${mensaje}`, extra !== undefined ? extra : '');
  },
  warn(mensaje, extra) {
    console.warn(`[${marcaTiempo()}] [WARN] ${mensaje}`, extra !== undefined ? extra : '');
  },
  error(mensaje, error) {
    console.error(`[${marcaTiempo()}] [ERROR] ${mensaje}`, error && !entorno.esProduccion ? error : '');
  },
};

module.exports = logger;
