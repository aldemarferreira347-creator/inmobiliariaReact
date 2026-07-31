const entorno = require('./src/configuracion/entorno');
const conectarBaseDatos = require('./src/configuracion/baseDatos');
const logger = require('./src/utilidades/logger');
const app = require('./src/app');
const tareasProgramadas = require('./src/tareasProgramadas');

async function iniciar() {
  await conectarBaseDatos();

  app.listen(entorno.puerto, () => {
    logger.info(`Servidor backend escuchando en el puerto ${entorno.puerto}`);
  });

  tareasProgramadas.iniciar();
}

iniciar().catch((error) => {
  logger.error('No se pudo iniciar el servidor', error);
  process.exit(1);
});
