import { useEffect, useState } from 'react';
import { ClipboardList, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import * as reservasServicio from '../../servicios/reservas.servicio';
import TarjetaReserva from '../../componentes/reservas/TarjetaReserva';

const ESTADOS_ICONO = {
  PENDIENTE_PAGO: { icon: Clock, color: '#f5a623' },
  CONFIRMADA:     { icon: CheckCircle, color: '#059669' },
  RECHAZADA:      { icon: XCircle, color: '#dc2626' },
  CANCELADA:      { icon: XCircle, color: '#6b7280' },
};

export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const data = await reservasServicio.misReservas();
    setReservas(data.reservas ?? []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const cancelar = async (id) => {
    await reservasServicio.cancelarPropia(id);
    await cargar();
  };

  // Estadísticas
  const stats = {
    total:       reservas.length,
    confirmadas: reservas.filter((r) => r.estado === 'CONFIRMADA').length,
    pendientes:  reservas.filter((r) => r.estado === 'PENDIENTE_PAGO').length,
    canceladas:  reservas.filter((r) => ['CANCELADA', 'RECHAZADA'].includes(r.estado)).length,
  };

  return (
    <div className="reservas-page">
      {/* ── Hero ── */}
      <div className="reservas-hero">
        <div className="reservas-hero-inner">
          <div>
            <span className="reservas-hero-badge">
              <ClipboardList className="h-3.5 w-3.5" /> Mis reservas
            </span>
            <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
              Historial de reservas
            </h1>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      {!cargando && reservas.length > 0 && (
        <div className="reservas-stats" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', valor: stats.total,       icon: ClipboardList, color: 'var(--color-navy-600)' },
            { label: 'Confirmadas', valor: stats.confirmadas, icon: CheckCircle, color: '#059669' },
            { label: 'Pendientes',  valor: stats.pendientes,  icon: Clock,       color: '#f5a623' },
            { label: 'Canceladas',  valor: stats.canceladas,  icon: XCircle,     color: '#dc2626' },
          ].map(({ label, valor, icon: Icon, color }) => (
            <div key={label} className="reservas-stat-card">
              <Icon style={{ width: 20, height: 20, color, margin: '0 auto 0.25rem' }} />
              <span className="stat-value" style={{ color }}>{valor}</span>
              <span className="stat-sub">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista ── */}
      <div className="reservas-container">
        {cargando ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando reservas...</p>
        ) : reservas.length === 0 ? (
          <div className="reservas-empty">
            <div className="reservas-empty-icon">
              <ClipboardList className="h-8 w-8" />
            </div>
            <h2>No tienes reservas</h2>
            <p>Aún no has realizado ninguna reserva. Explora el catálogo y reserva tu propiedad favorita.</p>
            <a href="/catalogo" className="btn-primary" style={{ marginTop: '0.75rem' }}>Ver inmuebles</a>
          </div>
        ) : (
          <div className="reservas-grid">
            {reservas.map((reserva) => (
              <TarjetaReserva key={reserva._id} reserva={reserva}>
                {reserva.estado === 'PENDIENTE_PAGO' && (
                  <button
                    type="button"
                    className="btn-panel-danger"
                    onClick={() => cancelar(reserva._id)}
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                  >
                    Cancelar
                  </button>
                )}
              </TarjetaReserva>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
