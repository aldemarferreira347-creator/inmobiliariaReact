const mongoose = require('mongoose');
const entorno = require('./entorno');
const logger = require('../utilidades/logger');

async function conectarBaseDatos() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(entorno.mongoUri);

  logger.info(`MongoDB conectado: ${mongoose.connection.name}`);

  mongoose.connection.on('error', (error) => {
    logger.error('Error de conexion a MongoDB', error);
  });

  return mongoose.connection;
}

module.exports = conectarBaseDatos;
