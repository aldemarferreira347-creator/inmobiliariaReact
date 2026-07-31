const conectarBaseDatos = require('../configuracion/baseDatos');
const logger = require('../utilidades/logger');
const Permiso = require('../modelos/Permiso');
const ConfigFranjaCita = require('../modelos/ConfigFranjaCita');
const sembrarPermisos = require('./permisos.seed');
const sembrarFranjas = require('./franjas.seed');

async function ejecutar() {
  await conectarBaseDatos();

  const cantidadPermisos = await sembrarPermisos(Permiso);
  logger.info(`Permisos sembrados: ${cantidadPermisos}`);

  const cantidadFranjas = await sembrarFranjas(ConfigFranjaCita);
  logger.info(`Franjas de citas sembradas: ${cantidadFranjas}`);

  process.exit(0);
}

ejecutar().catch((error) => {
  logger.error('Error al sembrar datos', error);
  process.exit(1);
});
