const cron = require('node-cron');
const logger = require('../utilidades/logger');
const reservaServicio = require('../servicios/reservaServicio');
const contratoServicio = require('../servicios/contratoServicio');

function iniciar() {
  // Cada hora en punto - equivalente a scripts/cron_expirar.php del PHP original (ejecutado antes
  // via Task Scheduler / cron del sistema): expira reservas vencidas y marca contratos vencidos.
  cron.schedule('0 * * * *', async () => {
    try {
      const total = await reservaServicio.expirarVencidas();
      if (total > 0) logger.info(`CRON: ${total} reserva(s) expirada(s) automaticamente`);
    } catch (error) {
      logger.error('CRON: fallo al expirar reservas vencidas', error);
    }

    try {
      const total = await contratoServicio.marcarVencidos();
      if (total > 0) logger.info(`CRON: ${total} contrato(s) marcado(s) como vencido(s)`);
    } catch (error) {
      logger.error('CRON: fallo al marcar contratos vencidos', error);
    }
  });

  logger.info('Tareas programadas iniciadas (expiracion de reservas y contratos cada hora)');
}

module.exports = { iniciar };
