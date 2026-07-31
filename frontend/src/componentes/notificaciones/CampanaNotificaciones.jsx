import { useEffect, useState, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import * as notificacionesServicio from '../../servicios/notificaciones.servicio';
import usePolling from '../../hooks/usePolling';

export default function CampanaNotificaciones() {
  const [cantidad, setCantidad] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const panelRef = useRef(null);

  const cargarContador = () => {
    notificacionesServicio.contador().then((data) => setCantidad(data.cantidad ?? 0)).catch(() => {});
  };

  useEffect(() => { cargarContador(); }, []);
  usePolling(cargarContador, 30000);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  const abrir = async () => {
    const nuevoEstado = !abierto;
    setAbierto(nuevoEstado);
    if (nuevoEstado) {
      const data = await notificacionesServicio.listar().catch(() => ({ notificaciones: [] }));
      setNotificaciones(data.notificaciones ?? []);
    }
  };

  const marcarTodas = async () => {
    await notificacionesServicio.marcarTodas();
    setCantidad(0);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <div className="campana-notificaciones" ref={panelRef}>
      <button
        type="button"
        onClick={abrir}
        aria-label={`Notificaciones${cantidad > 0 ? ` (${cantidad} no leídas)` : ''}`}
        className="!bg-transparent !p-2 text-white/80 hover:!bg-white/10 hover:!text-white relative"
      >
        <Bell className="h-5 w-5" />
        {cantidad > 0 && (
          <span className="badge-no-leidas" style={{ position: 'absolute', top: 2, right: 2 }}>
            {cantidad > 99 ? '99+' : cantidad}
          </span>
        )}
      </button>

      {abierto && (
        <div className="panel-notificaciones">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.5rem 0.25rem', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '0.25rem' }}>
            <strong style={{ fontSize: '0.8125rem' }}>Notificaciones</strong>
            {notificaciones.some((n) => !n.leida) && (
              <button
                type="button"
                onClick={marcarTodas}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-3.5 w-3.5" style={{ display: 'inline', marginRight: 3 }} />
                Marcar leídas
              </button>
            )}
          </div>

          {notificaciones.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8125rem', color: 'rgba(15,23,42,0.5)' }}>
              No tienes notificaciones.
            </p>
          ) : (
            notificaciones.slice(0, 10).map((n) => (
              <div
                key={n._id}
                className={`notificacion${n.leida ? '' : ' no-leida'}`}
              >
                <strong style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.125rem' }}>{n.titulo}</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(15,23,42,0.65)' }}>{n.mensaje}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
