import { useEffect, useState } from 'react';
import { Clock, Pencil, Save } from 'lucide-react';
import * as citasServicio from '../../servicios/citas.servicio';
import Modal from '../../componentes/comunes/Modal';
import { useToast } from '../../contexto/ToastContext';

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function FranjasAdmin() {
  const [franjas, setFranjas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [diaEditando, setDiaEditando] = useState(null);
  const [borrador, setBorrador] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const toast = useToast();

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

  const abrirEditar = (dia) => {
    setBorrador({ ...franjas[dia] });
    setDiaEditando(dia);
  };

  const actualizarBorrador = (campo, valor) => {
    setBorrador((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await citasServicio.guardarFranja(borrador);
      setFranjas((prev) => ({ ...prev, [diaEditando]: borrador }));
      toast.exito(`Franja de ${NOMBRES_DIA[diaEditando]} guardada correctamente.`);
      setDiaEditando(null);
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar la franja.');
    } finally {
      setGuardando(false);
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

      {cargando ? (
        <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando franjas...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {Object.values(franjas).map((franja) => (
            <div key={franja.diaSemana} className="panel-card" style={{ opacity: franja.activo ? 1 : 0.6, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{NOMBRES_DIA[franja.diaSemana]}</h3>
                <span className={franja.activo ? 'accent-green' : 'accent-red'}>{franja.activo ? 'Activo' : 'Inactivo'}</span>
              </div>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: '#334155' }}>
                {franja.horaInicio} – {franja.horaFin}
              </p>
              <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'rgba(15,23,42,0.55)' }}>
                Citas de {franja.duracionSlotMinutos} min
              </p>
              <button
                type="button"
                className="btn-panel-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
                onClick={() => abrirEditar(franja.diaSemana)}
              >
                <Pencil className="h-4 w-4" /> Editar
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        abierto={diaEditando !== null}
        onCerrar={() => setDiaEditando(null)}
        titulo={diaEditando !== null ? `Franja de ${NOMBRES_DIA[diaEditando]}` : ''}
      >
        {borrador && (
          <div>
            <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                checked={borrador.activo}
                onChange={(e) => actualizarBorrador('activo', e.target.checked)}
              />
              <span className="slider round"></span>
              <span style={{ fontSize: '0.875rem' }}>{borrador.activo ? 'Activo' : 'Inactivo'}</span>
            </label>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Hora inicio</label>
              <input
                type="time"
                value={borrador.horaInicio}
                onChange={(e) => actualizarBorrador('horaInicio', e.target.value)}
                disabled={!borrador.activo}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Hora fin</label>
              <input
                type="time"
                value={borrador.horaFin}
                onChange={(e) => actualizarBorrador('horaFin', e.target.value)}
                disabled={!borrador.activo}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Duración por cita (min)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={borrador.duracionSlotMinutos}
                onChange={(e) => actualizarBorrador('duracionSlotMinutos', Number(e.target.value))}
                disabled={!borrador.activo}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-panel-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={guardar}
                disabled={guardando}
              >
                <Save className="h-4 w-4" /> {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setDiaEditando(null)} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
