const entorno = require('./entorno');

const opcionesCors = {
  origin: entorno.urlFrontend,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

module.exports = opcionesCors;
