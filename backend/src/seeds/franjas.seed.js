// Lunes(1) a Sabado(6) 08:00-18:00 cada 30 min; Domingo(0) sin franja = no disponible.
const DIAS_LABORALES = [1, 2, 3, 4, 5, 6];

async function sembrarFranjas(ConfigFranjaCita) {
  for (const diaSemana of DIAS_LABORALES) {
    await ConfigFranjaCita.updateOne(
      { diaSemana },
      { $set: { horaInicio: '08:00', horaFin: '18:00', duracionSlotMinutos: 30, activo: true } },
      { upsert: true }
    );
  }
  return DIAS_LABORALES.length;
}

module.exports = sembrarFranjas;
