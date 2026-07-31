import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, ClipboardList, FileText, Calendar, DollarSign, TrendingUp, BarChart2 } from 'lucide-react';
import * as estadisticasServicio from '../../servicios/estadisticas.servicio';

export default function PanelAdmin() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    estadisticasServicio.obtener()
      .then((data) => setStats(data.estadisticas ?? data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const tarjetas = [
    { label: 'Inmuebles',    valor: stats?.inmuebles    ?? '—', icon: Building2,    to: '/administrador/inmuebles',  color: 'var(--color-navy-600)' },
    { label: 'Clientes',     valor: stats?.clientes     ?? '—', icon: Users,         to: '/administrador/usuarios',   color: '#059669' },
    { label: 'Reservas',     valor: stats?.reservas     ?? '—', icon: ClipboardList, to: '/administrador/reservas',   color: '#f5a623' },
    { label: 'Contratos',    valor: stats?.contratos    ?? '—', icon: FileText,      to: '/administrador/contratos',  color: 'var(--color-navy-500)' },
    { label: 'Citas',        valor: stats?.citas        ?? '—', icon: Calendar,      to: '/administrador/citas',      color: '#7c3aed' },
    { label: 'Ventas',       valor: stats?.ventas       ?? '—', icon: DollarSign,    to: '/administrador/reportes',   color: '#dc2626' },
  ];

  const accesos = [
    { texto: 'Gestionar inmuebles',  to: '/administrador/inmuebles',  icon: Building2 },
    { texto: 'Gestionar usuarios',   to: '/administrador/usuarios',   icon: Users },
    { texto: 'Ver reservas',         to: '/administrador/reservas',   icon: ClipboardList },
    { texto: 'Ver contratos',        to: '/administrador/contratos',  icon: FileText },
    { texto: 'Ver citas',            to: '/administrador/citas',      icon: Calendar },
    { texto: 'Reportes',             to: '/administrador/reportes',   icon: BarChart2 },
  ];

  return (
    <div>
      {/* Topbar */}
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Panel de Administración
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            Resumen general del sistema
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      {cargando ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(15,23,42,0.5)' }}>Cargando estadísticas...</p>
      ) : (
        <div className="stat-cards">
          {tarjetas.map(({ label, valor, icon: Icon, to, color }) => (
            <Link key={label} to={to} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="stat-value" style={{ color }}>{valor}</span>
              <span className="stat-sub">{label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="panel-card">
        <div className="panel-card-header">
          <h2><BarChart2 className="h-5 w-5" /> Accesos rápidos</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {accesos.map(({ texto, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="tool-card"
              style={{ textDecoration: 'none', color: 'inherit', padding: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <Icon style={{ width: 18, height: 18, color: 'var(--color-navy-500)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{texto}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
