const ConfigFranjaCita = require('../modelos/ConfigFranjaCita');

async function listar() {
  return ConfigFranjaCita.find().sort({ diaSemana: 1 });
}

async function guardar({ diaSemana, horaInicio, horaFin, duracionSlotMinutos, activo }) {
  return ConfigFranjaCita.findOneAndUpdate(
    { diaSemana },
    { horaInicio, horaFin, duracionSlotMinutos, activo },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

module.exports = { listar, guardar };
