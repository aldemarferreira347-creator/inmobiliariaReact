import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CreditCard, ClipboardList, AlertTriangle, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import * as reservasServicio from '../../servicios/reservas.servicio';
import { claseEstadoReserva } from '../../utilidades/colorEstado';
import { useToast } from '../../contexto/ToastContext';

function fmt(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
}
function fmtFecha(f) {
  return f ? new Date(f).toLocaleString('es-CO') : '—';
}

const ESTADO_ICONO = {
  PENDIENTE_PAGO:  Clock,
  PROCESANDO_PAGO: CreditCard,
  CONFIRMADA:      CheckCircle,
  RECHAZADA:       XCircle,
  CANCELADA:       Ban,
  EXPIRADA:        Clock,
};

const ESTADO_COLOR = {
  CONFIRMADA:      '#059669',
  PENDIENTE_PAGO:  '#f5a623',
  PROCESANDO_PAGO: '#7c3aed',
  RECHAZADA:       '#dc2626',
  CANCELADA:       '#64748b',
  EXPIRADA:        '#64748b',
};

export default function AdminReservaDetalle({ id, onCancelada }) {
  const [reserva, setReserva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const toast = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await reservasServicio.detalle(id);
      setReserva(data.reserva ?? data);
    } catch {
      setReserva(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [id]); // eslint-disable-line

  const cancelar = async () => {
    if (!window.confirm('¿Cancelar esta reserva administrativamente? El inmueble volverá a estar disponible.')) return;
    setCancelando(true);
    try {
      await reservasServicio.cancelarAdmin(id);
      toast.exito('Reserva cancelada correctamente.');
      await cargar();
      onCancelada?.();
    } catch (e) {
      toast.error(e.response?.data?.mensaje || 'No se pudo cancelar la reserva.');
    } finally {
      setCancelando(false);
    }
  };

  if (cargando) return <p style={{ padding: '3rem', textAlign: 'center' }}>Cargando detalle...</p>;
  if (!reserva)  return <p style={{ padding: '3rem', textAlign: 'center' }}>Reserva no encontrada.</p>;

  const estado = reserva.estado;
  const IconoEstado = ESTADO_ICONO[estado] ?? Clock;
  const colorEstado = ESTADO_COLOR[estado] ?? '#64748b';
  const cancelable = !['CANCELADA', 'RECHAZADA', 'EXPIRADA', 'CONFIRMADA'].includes(estado);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
          {reserva.inmueble?.titulo} · {reserva.cliente?.nombre} {reserva.cliente?.apellido}
        </p>
        <span className={`badge ${claseEstadoReserva(estado)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <IconoEstado className="h-4 w-4" style={{ color: colorEstado }} />
          {estado}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(260px, 320px)', gap: '1.5rem', alignItems: 'start' }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Info principal */}
          <div className="panel-card">
            <div className="panel-card-header">
              <h2><FileText className="h-5 w-5" /> Información de la reserva</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
              {[
                { label: 'Cliente',     value: `${reserva.cliente?.nombre ?? ''} ${reserva.cliente?.apellido ?? ''}` },
                { label: 'Correo',      value: reserva.cliente?.correo ?? '—' },
                { label: 'Teléfono',    value: reserva.cliente?.telefono ?? '—' },
                { label: 'Inmueble',    value: reserva.inmueble?.titulo ?? '—' },
                { label: 'Código inm.', value: reserva.inmueble?.codigo ?? '—' },
                { label: 'Monto',       value: fmt(reserva.monto), highlight: true },
                { label: 'Vencimiento', value: fmtFecha(reserva.fechaExpiracion) },
                { label: 'Creada',      value: fmtFecha(reserva.fechaCreacion ?? reserva.createdAt) },
              ].map(({ label, value, highlight }) => (
                <div key={label}>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  <p style={{ margin: '0.2rem 0 0', fontWeight: highlight ? 700 : 500, fontSize: '0.9375rem', color: highlight ? 'var(--color-gold-600, #d97706)' : '#1e293b' }}>{value}</p>
                </div>
              ))}
            </div>
            {reserva.inmueble?._id && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <Link to={`/inmuebles/${reserva.inmueble._id}`} target="_blank" rel="noreferrer" className="btn-panel-edit" style={{ textDecoration: 'none' }}>
                  Ver ficha del inmueble ↗
                </Link>
              </div>
            )}
          </div>

          {/* Historial de pagos */}
          <div className="panel-card">
            <div className="panel-card-header">
              <h2><CreditCard className="h-5 w-5" /> Historial de pagos</h2>
            </div>
            {!reserva.pagos?.length ? (
              <div className="empty-state" style={{ margin: '1rem 0' }}>
                <div className="empty-state-icon"><CreditCard className="h-7 w-7" /></div>
                <p className="empty-state-title">Sin intentos de pago</p>
                <p className="empty-state-sub">El cliente aún no ha iniciado ningún intento de pago.</p>
              </div>
            ) : (
              <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                <table className="panel-table">
                  <thead>
                    <tr>
                      <th>Fecha</th><th>Monto</th><th>Estado</th><th>ID transacción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reserva.pagos.map((p, i) => (
                      <tr key={p._id ?? i}>
                        <td className="td-date">{fmtFecha(p.creadoEn ?? p.createdAt)}</td>
                        <td className="td-price">{fmt(p.monto)}</td>
                        <td><span className="badge">{p.estado}</span></td>
                        <td className="td-id" style={{ fontSize: '0.75rem' }}>{p.idTransaccion ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Zona de peligro — cancelación */}
          {cancelable && (
            <div className="panel-card" style={{ border: '1px solid #fca5a5' }}>
              <div className="panel-card-header" style={{ borderBottom: '1px solid #fca5a5' }}>
                <h2 style={{ color: '#dc2626' }}><AlertTriangle className="h-5 w-5" /> Zona de peligro</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(15,23,42,0.6)', marginTop: '0.75rem', marginBottom: '1rem' }}>
                Cancelar esta reserva hará que el inmueble vuelva a estar disponible para reserva.
              </p>
              <button
                type="button"
                className="btn-panel-danger"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 6 }}
                onClick={cancelar}
                disabled={cancelando}
              >
                <Ban className="h-4 w-4" />
                {cancelando ? 'Cancelando...' : 'Cancelar reserva'}
              </button>
            </div>
          )}

          {/* Historial de auditoría */}
          <div className="panel-card">
            <div className="panel-card-header">
              <h2><ClipboardList className="h-5 w-5" /> Historial de auditoría</h2>
            </div>
            {!reserva.historial?.length ? (
              <p style={{ fontSize: '0.875rem', color: 'rgba(15,23,42,0.45)', marginTop: '0.75rem' }}>Sin registros de auditoría.</p>
            ) : (
              <div className="historial-timeline" style={{ marginTop: '0.75rem' }}>
                {reserva.historial.map((h, i) => (
                  <div key={i} className="historial-item">
                    <div className="historial-dot" />
                    <div className="historial-content">
                      <div className="historial-estados">
                        <span className="h-estado-de">{h.estadoAnterior}</span>
                        <span className="h-arrow">→</span>
                        <span className="h-estado-a">{h.estadoNuevo}</span>
                      </div>
                      {h.comentario && <p className="historial-comentario">{h.comentario}</p>}
                      <div className="historial-meta">
                        {h.usuario ? `👤 ${h.usuario}` : '🖥 Sistema'} · {fmtFecha(h.creadoEn ?? h.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
