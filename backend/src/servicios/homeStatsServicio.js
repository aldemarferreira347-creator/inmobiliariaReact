const Inmueble = require('../modelos/Inmueble');
const Usuario = require('../modelos/Usuario');
const Cita = require('../modelos/Cita');
const { ROLES, ESTADOS_USUARIO } = require('../utilidades/constantes');
const logger = require('../utilidades/logger');

// Igual que HomeStatsService del PHP original: cache en memoria de 10 minutos (alli era un
// archivo storage/cache/home_stats.json) para no recalcular estos 4 conteos en cada visita a la
// pagina publica de inicio. Sin invalidacion por escritura en otras rutas - puramente por tiempo.
const TTL_MS = 10 * 60 * 1000;
let cache = null;
let expiraEn = 0;

async function calcularDesdeBd() {
  const [inmuebles, clientes, asesores, citas] = await Promise.all([
    Inmueble.countDocuments({ estado: { $in: ['Disponible', 'Reservado', 'Ocupado'] } }),
    Usuario.countDocuments({ rol: ROLES.CLIENTE, estado: ESTADOS_USUARIO.ACTIVO }),
    Usuario.countDocuments({ rol: ROLES.ASESOR, estado: ESTADOS_USUARIO.ACTIVO }),
    Cita.countDocuments({ estado: { $ne: 'Cancelada' } }),
  ]);

  return { inmuebles, clientes, asesores, citas };
}

async function obtenerEstadisticas() {
  if (cache && Date.now() < expiraEn) {
    return cache;
  }

  try {
    cache = await calcularDesdeBd();
    expiraEn = Date.now() + TTL_MS;
    return cache;
  } catch (error) {
    logger.error('Fallo calculando estadisticas de inicio', error);
    // Igual que el fallback del PHP original: la pagina de inicio nunca debe romperse por esto.
    return { inmuebles: 0, clientes: 0, asesores: 0, citas: 0 };
  }
}

module.exports = { obtenerEstadisticas };
