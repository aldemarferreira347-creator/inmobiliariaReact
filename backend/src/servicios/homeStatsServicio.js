const Inmueble = require('../modelos/Inmueble');
const Usuario = require('../modelos/Usuario');
const Cita = require('../modelos/Cita');
const Reserva = require('../modelos/Reserva');
const Contrato = require('../modelos/Contrato');
const Venta = require('../modelos/Venta');
const { ROLES, ESTADOS_USUARIO } = require('../utilidades/constantes');
const logger = require('../utilidades/logger');

// Igual que HomeStatsService del PHP original: cache en memoria de 10 minutos (alli era un
// archivo storage/cache/home_stats.json) para no recalcular estos conteos en cada visita a la
// pagina publica de inicio. Sin invalidacion por escritura en otras rutas - puramente por tiempo.
// Los conteos de reservas/contratos/ventas no existian en el HomeStatsService original (el PHP no
// tenia un dashboard de administrador propio) pero se agregan aqui para alimentar el panel de
// administracion de React, que ya los espera; son totales agregados, no datos sensibles.
const TTL_MS = 10 * 60 * 1000;
let cache = null;
let expiraEn = 0;

async function calcularDesdeBd() {
  const [inmuebles, clientes, asesores, citas, reservas, contratos, ventas] = await Promise.all([
    Inmueble.countDocuments({ estado: { $in: ['Disponible', 'Reservado', 'Ocupado'] } }),
    Usuario.countDocuments({ rol: ROLES.CLIENTE, estado: ESTADOS_USUARIO.ACTIVO }),
    Usuario.countDocuments({ rol: ROLES.ASESOR, estado: ESTADOS_USUARIO.ACTIVO }),
    Cita.countDocuments({ estado: { $ne: 'Cancelada' } }),
    Reserva.countDocuments({ eliminado: { $ne: true } }),
    Contrato.countDocuments(),
    Venta.countDocuments(),
  ]);

  return { inmuebles, clientes, asesores, citas, reservas, contratos, ventas };
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
    return { inmuebles: 0, clientes: 0, asesores: 0, citas: 0, reservas: 0, contratos: 0, ventas: 0 };
  }
}

module.exports = { obtenerEstadisticas };
