const multer = require('multer');

// Se usa memoryStorage porque la validacion real (magic bytes) ocurre despues, en los servicios,
// antes de escribir el archivo a disco.
const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = subida;
