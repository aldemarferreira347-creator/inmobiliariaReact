import { useEffect, useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import * as citasServicio from '../../servicios/citas.servicio';
import TarjetaCita from '../../componentes/citas/TarjetaCita';

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    const data = await citasServicio.misCitas();
    setCitas(data.citas ?? []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const cancelar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;
    setError('');
    try {
      await citasServicio.cancelarPropia(id);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo cancelar la cita.');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="panel-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <div className="panel-card-header panel-card-header--between">
          <h2><Calendar className="h-5 w-5" /> Mis citas</h2>
          {!cargando && <span className="badge" style={{ backgroundColor: 'var(--color-navy-500)' }}>{citas.length}</span>}
        </div>

        {error && (
          <div className="auth-alert error" style={{ margin: '1rem 0 0' }}>
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando citas...</p>
        ) : citas.length === 0 ? (
          <div className="empty-state" style={{ margin: '1rem 0' }}>
            <div className="empty-state-icon"><Calendar className="h-8 w-8" /></div>
            <p className="empty-state-title">No tienes citas agendadas</p>
            <p className="empty-state-sub">Programa una visita a cualquier inmueble desde el catálogo.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {citas.map((cita) => (
              <TarjetaCita key={cita._id} cita={cita}>
                {['Pendiente', 'Asignada'].includes(cita.estado) && (
                  <button 
                    type="button" 
                    className="btn-panel-danger" 
                    onClick={() => cancelar(cita._id)}
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  >
                    Cancelar cita
                  </button>
                )}
              </TarjetaCita>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
