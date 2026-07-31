import { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertCircle, Save } from 'lucide-react';
import * as citasServicio from '../../servicios/citas.servicio';

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function FranjasAdmin() {
  const [franjas, setFranjas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);

  const cargar = async () => {
    setCargando(true);
    const data = await citasServicio.listarFranjas();
    const mapa = {};
    for (let dia = 0; dia <= 6; dia += 1) {
      const existente = data.franjas.find((f) => f.diaSemana === dia);
      mapa[dia] = existente || { diaSemana: dia, horaInicio: '08:00', horaFin: '18:00', duracionSlotMinutos: 30, activo: false };
    }
    setFranjas(mapa);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const actualizarCampo = (dia, campo, valor) => {
    setFranjas((prev) => ({ ...prev, [dia]: { ...prev[dia], [campo]: valor } }));
  };

  const guardar = async (dia) => {
    setMensaje(null);
    try {
      await citasServicio.guardarFranja(franjas[dia]);
      setMensaje({ tipo: 'success', texto: `Franja de ${NOMBRES_DIA[dia]} guardada correctamente.` });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo guardar la franja.' });
    }
  };

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Franjas de atención
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            Configura los horarios disponibles para agendar citas
          </p>
        </div>
      </div>

      {mensaje && (
        <div className={`alert ${mensaje.tipo}`} style={{ marginBottom: '1.5rem' }}>
          {mensaje.tipo === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando franjas...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {Object.values(franjas).map((franja) => (
            <div key={franja.diaSemana} className="panel-card" style={{ opacity: franja.activo ? 1 : 0.6, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{NOMBRES_DIA[franja.diaSemana]}</h3>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={franja.activo}
                    onChange={(e) => actualizarCampo(franja.diaSemana, 'activo', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Hora inicio</label>
                <input
                  type="time"
                  value={franja.horaInicio}
                  onChange={(e) => actualizarCampo(franja.diaSemana, 'horaInicio', e.target.value)}
                  disabled={!franja.activo}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Hora fin</label>
                <input
                  type="time"
                  value={franja.horaFin}
                  onChange={(e) => actualizarCampo(franja.diaSemana, 'horaFin', e.target.value)}
                  disabled={!franja.activo}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Duración por cita (min)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={franja.duracionSlotMinutos}
                  onChange={(e) => actualizarCampo(franja.diaSemana, 'duracionSlotMinutos', Number(e.target.value))}
                  disabled={!franja.activo}
                />
              </div>

              <button
                type="button"
                className="btn-panel-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
                onClick={() => guardar(franja.diaSemana)}
              >
                <Save className="h-4 w-4" /> Guardar cambios
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
