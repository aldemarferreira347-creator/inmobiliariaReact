import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, PenLine } from 'lucide-react';
import * as citasServicio from '../../servicios/citas.servicio';
import TarjetaCita from '../../componentes/citas/TarjetaCita';

export default function CitasAsignadas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    citasServicio
      .citasDeAsesor()
      .then((data) => setCitas(data.citas ?? []))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Mis citas asignadas
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            {citas.length} citas programadas
          </p>
        </div>
      </div>

      {cargando ? (
        <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando citas...</p>
      ) : citas.length === 0 ? (
        <div className="panel-card">
          <div className="empty-state" style={{ margin: '1rem 0' }}>
            <div className="empty-state-icon"><Calendar className="h-8 w-8" /></div>
            <p className="empty-state-title">No tienes citas asignadas</p>
            <p className="empty-state-sub">Las citas que el administrador te asigne aparecerán aquí.</p>
          </div>
        </div>
      ) : (
        <div className="panel-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {citas.map((cita) => (
              <TarjetaCita key={cita._id} cita={cita}>
                {cita.estado === 'Asignada' && (
                  <Link 
                    to={`/asesor/citas/${cita._id}`} 
                    className="btn-panel-primary" 
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
                  >
                    <PenLine className="h-4 w-4" /> Registrar observación
                  </Link>
                )}
              </TarjetaCita>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
