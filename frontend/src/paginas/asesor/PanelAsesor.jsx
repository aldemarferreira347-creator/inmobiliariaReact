import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, DollarSign, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexto/AuthContext';
import * as citasServicio from '../../servicios/citas.servicio';
import * as ventasServicio from '../../servicios/ventas.servicio';
import TarjetaCita from '../../componentes/citas/TarjetaCita';

export default function PanelAsesor() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      citasServicio.citasDeAsesor?.().catch(() => ({ citas: [] })),
      ventasServicio.misVentas?.().catch(() => ({ ventas: [] })),
    ]).then(([citasData, ventasData]) => {
      setCitas(citasData.citas ?? []);
      setVentas(ventasData.ventas ?? []);
    }).finally(() => setCargando(false));
  }, []);

  const stats = [
    { label: 'Citas asignadas',    valor: citas.length,  icon: Calendar,    color: 'var(--color-navy-600)' },
    { label: 'Ventas registradas', valor: ventas.length, icon: DollarSign,  color: '#059669' },
    { label: 'Inmuebles activos',  valor: '—',           icon: Building2,   color: '#f5a623' },
  ];

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Bienvenido, {usuario?.nombre ?? 'Asesor'}
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            Panel de asesor inmobiliario
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stat-cards">
        {stats.map(({ label, valor, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="stat-value" style={{ color }}>{valor}</span>
            <span className="stat-sub">{label}</span>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-card-header panel-card-header--between">
          <h2><Calendar className="h-5 w-5" /> Accesos rápidos</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {[
            { to: '/asesor/citas',    texto: 'Mis citas',     icon: Calendar },
            { to: '/asesor/ventas',   texto: 'Mis ventas',    icon: DollarSign },
            { to: '/asesor/mensajes', texto: 'Mensajes',      icon: MessageSquare },
            { to: '/catalogo',        texto: 'Ver catálogo',  icon: Building2 },
          ].map(({ to, texto, icon: Icon }) => (
            <Link key={to} to={to} className="btn-panel-primary" style={{ textDecoration: 'none', gap: 6 }}>
              <Icon className="h-4 w-4" /> {texto}
            </Link>
          ))}
        </div>
      </div>

      {/* Próximas citas */}
      {!cargando && citas.length > 0 && (
        <div className="panel-card">
          <div className="panel-card-header panel-card-header--between">
            <h2><Calendar className="h-5 w-5" /> Próximas citas</h2>
            <Link to="/asesor/citas" className="btn-text">Ver todas →</Link>
          </div>
          {citas.slice(0, 3).map((cita) => <TarjetaCita key={cita._id} cita={cita} />)}
        </div>
      )}
    </div>
  );
}
