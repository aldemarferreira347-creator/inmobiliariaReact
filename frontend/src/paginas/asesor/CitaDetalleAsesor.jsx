import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, PenLine, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import * as citasServicio from '../../servicios/citas.servicio';
import TarjetaCita from '../../componentes/citas/TarjetaCita';

export default function CitaDetalleAsesor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cita, setCita] = useState(null);
  const [observacion, setObservacion] = useState(null);
  const [contenido, setContenido] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const data = await citasServicio.detalle(id);
    setCita(data.cita);
    setObservacion(data.observacion ?? null);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const guardar = async () => {
    setMensaje(null);
    setGuardando(true);
    try {
      await citasServicio.registrarObservacion(id, contenido);
      navigate('/asesor');
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo registrar la observación' });
    } finally {
      setGuardando(false);
    }
  };

  if (!cita) return <p style={{ padding: '3rem', textAlign: 'center' }}>Cargando cita...</p>;

  return (
    <div>
      {/* Topbar */}
      <div className="panel-topbar">
        <div>
          <button type="button" onClick={() => navigate('/asesor/citas')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', padding: 0 }}>
            <ArrowLeft className="h-4 w-4" /> Volver a mis citas
          </button>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Detalle de la cita
          </h1>
        </div>
      </div>

      {/* Tarjeta de la cita */}
      <div className="panel-card" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-card-header">
          <h2><Calendar className="h-5 w-5" /> Información de la cita</h2>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <TarjetaCita cita={cita} />
        </div>
      </div>

      {/* Observación */}
      <div className="panel-card">
        <div className="panel-card-header">
          <h2><PenLine className="h-5 w-5" /> Observación</h2>
        </div>

        {observacion ? (
          <div style={{ marginTop: '0.75rem' }}>
            <div className="alert success" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle className="h-4 w-4 shrink-0" style={{ marginTop: 2 }} />
              <div>
                <strong>Observación ya registrada</strong>
                <p style={{ margin: '0.5rem 0 0', lineHeight: 1.6, color: '#166534' }}>{observacion.contenido}</p>
              </div>
            </div>
          </div>
        ) : cita.estado === 'Asignada' ? (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'rgba(15,23,42,0.6)', marginBottom: '0.75rem' }}>
              Registra las observaciones de la visita para marcarla como realizada.
            </p>
            <div className="form-group">
              <label htmlFor="observacion" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Observaciones de la visita
              </label>
              <textarea
                id="observacion"
                rows={5}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Describe el resultado de la visita, el estado del inmueble, comentarios del cliente..."
                style={{ marginTop: '0.5rem', resize: 'vertical' }}
              />
            </div>

            {mensaje && (
              <div className={`alert ${mensaje.tipo}`} style={{ marginTop: '0.75rem', display: 'flex', gap: 8 }}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                {mensaje.texto}
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-panel-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={guardar}
                disabled={!contenido.trim() || guardando}
              >
                <CheckCircle className="h-4 w-4" />
                {guardando ? 'Guardando...' : 'Guardar y marcar como realizada'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'rgba(15,23,42,0.5)' }}>
            Esta cita no admite observaciones en su estado actual ({cita.estado}).
          </p>
        )}
      </div>
    </div>
  );
}
