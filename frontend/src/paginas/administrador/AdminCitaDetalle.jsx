import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Building2, PenLine, Clock } from 'lucide-react';
import * as citasServicio from '../../servicios/citas.servicio';
import TarjetaCita from '../../componentes/citas/TarjetaCita';

const ESTADO_COLOR = {
  Asignada:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  Realizada: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  Cancelada: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  Pendiente: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
};

export default function AdminCitaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cita, setCita] = useState(null);
  const [observacion, setObservacion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    citasServicio.detalle(id)
      .then((data) => {
        setCita(data.cita);
        setObservacion(data.observacion ?? null);
      })
      .catch(() => setCita(null))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p style={{ padding: '3rem', textAlign: 'center' }}>Cargando detalle de la cita...</p>;
  if (!cita)    return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <p>Cita no encontrada.</p>
      <Link to="/administrador/citas" style={{ display: 'inline-flex', gap: 6, marginTop: '1rem', textDecoration: 'none' }} className="btn-panel-primary">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
    </div>
  );

  const estadoStyle = ESTADO_COLOR[cita.estado] ?? ESTADO_COLOR.Cancelada;

  return (
    <div>
      {/* Topbar */}
      <div className="panel-topbar">
        <div>
          <button type="button" onClick={() => navigate('/administrador/citas')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', padding: 0 }}>
            <ArrowLeft className="h-4 w-4" /> Volver a gestión de citas
          </button>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Detalle de cita
          </h1>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: estadoStyle.bg, color: estadoStyle.color, border: `1px solid ${estadoStyle.border}`, padding: '0.4rem 0.9rem', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.875rem' }}>
          {cita.estado}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Datos del cliente */}
        <div className="panel-card">
          <div className="panel-card-header">
            <h2><User className="h-5 w-5" /> Información del cliente</h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {[
              { label: 'Nombre',       value: `${cita.cliente?.nombre ?? ''} ${cita.cliente?.apellido ?? ''}` },
              { label: 'Correo',       value: cita.cliente?.correo ?? '—' },
              { label: 'Teléfono',     value: cita.cliente?.telefono ?? '—' },
              { label: 'Fecha / hora', value: cita.fecha ? new Date(cita.fecha).toLocaleString('es-CO') : `${cita.fechaCita ?? '—'} ${cita.horaInicio ?? ''} – ${cita.horaFin ?? ''}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Datos del inmueble */}
        <div className="panel-card">
          <div className="panel-card-header">
            <h2><Building2 className="h-5 w-5" /> Inmueble a visitar</h2>
          </div>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {[
              { label: 'Código',    value: cita.inmueble?.codigo ?? '—' },
              { label: 'Título',    value: cita.inmueble?.titulo ?? '—' },
              { label: 'Ciudad',    value: cita.inmueble?.ubicacion?.ciudad ?? '—' },
              { label: 'Dirección', value: cita.inmueble?.ubicacion?.direccion ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{value}</p>
              </div>
            ))}
          </div>
          {cita.inmueble?._id && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <Link to={`/inmuebles/${cita.inmueble._id}`} target="_blank" rel="noreferrer" className="btn-panel-edit" style={{ textDecoration: 'none' }}>
                Ver ficha del inmueble ↗
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta completa de la cita */}
      <div style={{ marginTop: '1.25rem' }}>
        <TarjetaCita cita={cita} />
      </div>

      {/* Observaciones del asesor */}
      <div className="panel-card" style={{ marginTop: '1.25rem' }}>
        <div className="panel-card-header">
          <h2><PenLine className="h-5 w-5" /> Observaciones del asesor</h2>
        </div>
        {observacion ? (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap' }}>{observacion.contenido}</p>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'rgba(15,23,42,0.55)' }}>
              {observacion.asesor && <span>👤 {observacion.asesor.nombre} {observacion.asesor.apellido}</span>}
              {observacion.creadoEn && <span>📅 {new Date(observacion.creadoEn).toLocaleString('es-CO')}</span>}
            </div>
          </div>
        ) : cita.estado === 'Realizada' ? (
          <div className="alert error" style={{ marginTop: '0.75rem' }}>
            ⚠️ Esta cita está marcada como <strong>Realizada</strong> pero no tiene observaciones registradas.
          </div>
        ) : cita.estado === 'Asignada' ? (
          <div className="alert info" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock className="h-4 w-4" />
            La cita aún no ha sido completada. Las observaciones estarán disponibles después de la visita.
          </div>
        ) : (
          <p style={{ marginTop: '0.75rem', color: 'rgba(15,23,42,0.45)', fontSize: '0.875rem' }}>Sin observaciones registradas.</p>
        )}
      </div>
    </div>
  );
}
