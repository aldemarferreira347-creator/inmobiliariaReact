import { useState, useEffect } from 'react';
import { Bell, Inbox, CheckCheck, CircleCheck, TriangleAlert, CircleX, Clock, Check, AlertCircle } from 'lucide-react';
import * as notificacionesServicio from '../../servicios/notificaciones.servicio';

export default function NotificacionesCliente() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const data = await notificacionesServicio.listar();
      setNotificaciones(data.notificaciones ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const marcarTodas = async () => {
    setError('');
    try {
      await notificacionesServicio.marcarTodas();
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudieron marcar las notificaciones como leídas.');
    }
  };

  const marcarUna = async (id) => {
    if (!window.confirm('Al marcar como leída la notificación se ocultará/marcará. ¿Aceptas?')) return;
    setError('');
    try {
      await notificacionesServicio.marcarUna(id);
      setNotificaciones(prev => prev.map(n => n._id === id ? { ...n, leida: true } : n));
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo marcar la notificación como leída.');
    }
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'success': return <CircleCheck className="h-5 w-5" />;
      case 'warning': return <TriangleAlert className="h-5 w-5" />;
      case 'error': return <CircleX className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Mini Hero */}
      <div className="page-hero" style={{ padding: '2rem 1.5rem', background: '#0f1e4a', color: 'white', borderRadius: '0.75rem', marginBottom: '2rem' }}>
        <span className="page-hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.75rem' }}>
          <Bell className="h-3.5 w-3.5" /> Centro de mensajes
        </span>
        <h1 style={{ marginTop: '1rem', fontSize: '2rem' }}>Notificaciones</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>{noLeidas} sin leer · {notificaciones.length} en total</p>
      </div>

      <div className="panel-card" style={{ padding: '1.5rem' }}>
        <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem' }}>Notificaciones</h2>
            <p className="notif-subtitle" style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
              {noLeidas > 0 ? (
                <>Tienes <strong>{noLeidas}</strong> notificación(es) sin leer</>
              ) : (
                'Estás al día'
              )}
            </p>
          </div>
          {noLeidas > 0 && (
            <button onClick={marcarTodas} className="btn-panel-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}>
              <CheckCheck className="h-4 w-4" /> Marcar todas como leídas
            </button>
          )}
        </div>

        {error && (
          <div className="auth-alert error" style={{ marginBottom: '1rem' }}>
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="notif-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cargando ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Cargando notificaciones...</p>
          ) : notificaciones.length === 0 ? (
            <div className="notif-empty" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div className="notif-empty-icon" style={{ display: 'inline-flex', padding: '1rem', background: '#f1f5f9', borderRadius: '50%', color: '#94a3b8', marginBottom: '1rem' }}>
                <Inbox className="h-8 w-8" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem' }}>Sin notificaciones</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Cuando recibas consultas sobre propiedades o actualizaciones importantes, aparecerán aquí.</p>
            </div>
          ) : (
            notificaciones.map((notif) => (
              <div key={notif._id} className={`notif-card ${notif.leida ? 'leida' : 'no-leida'}`} style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: notif.leida ? '#f8fafc' : 'white', opacity: notif.leida ? 0.7 : 1 }}>
                <div className={`notif-icon notif-tipo-${notif.tipo || 'info'}`} style={{ color: notif.tipo === 'success' ? '#10b981' : notif.tipo === 'error' ? '#ef4444' : notif.tipo === 'warning' ? '#f59e0b' : '#3b82f6', background: notif.tipo === 'success' ? '#d1fae5' : notif.tipo === 'error' ? '#fee2e2' : notif.tipo === 'warning' ? '#fef3c7' : '#dbeafe', padding: '0.75rem', borderRadius: '50%', height: 'max-content' }}>
                  {getIcon(notif.tipo)}
                </div>
                <div className="notif-body" style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#0f1e4a' }}>{notif.titulo}</h4>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#475569' }}>{notif.mensaje}</p>
                  <span className="notif-time" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#94a3b8' }}>
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(notif.createdAt || notif.fecha).toLocaleString('es-CO')}
                  </span>
                </div>
                {!notif.leida && (
                  <button onClick={() => marcarUna(notif._id)} className="notif-mark" aria-label="Marcar como leída" title="Marcar como leída" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', height: 'max-content' }}>
                    <Check className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
