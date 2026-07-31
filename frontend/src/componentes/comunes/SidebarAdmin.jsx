import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, Users, ClipboardList, FileText, Calendar,
  Clock, BarChart2, MessageSquare, Search, Bell,
  Megaphone, Shield, LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexto/AuthContext';

const ENLACES_ADMIN = [
  { to: '/administrador/inmuebles',     texto: 'Gestión de Inmuebles',  Icon: Building2 },
  { to: '/administrador/usuarios',      texto: 'Gestión de Clientes',   Icon: Users },
  { to: '/administrador/reservas',      texto: 'Reservas',              Icon: ClipboardList },
  { to: '/administrador/contratos',     texto: 'Contratos',             Icon: FileText },
  { to: '/administrador/citas',         texto: 'Gestión de Citas',      Icon: Calendar },
  { to: '/administrador/franjas',       texto: 'Franjas de Citas',      Icon: Clock },
  { to: '/administrador/reportes',      texto: 'Reportes',              Icon: BarChart2 },
  { to: '/administrador/mensajes',      texto: 'Mensajes',              Icon: MessageSquare },
  { to: '/catalogo',                    texto: 'Ver catálogo',          Icon: Search },
  { to: '/notificaciones',              texto: 'Notificaciones',        Icon: Bell },
  { to: '/administrador/notificaciones',texto: 'Enviar Notificación',   Icon: Megaphone },
  { to: '/administrador/permisos',      texto: 'Roles y Permisos',      Icon: Shield },
];

export default function SidebarAdmin() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await cerrarSesion();
    navigate('/login');
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre ?? 'Admin')}&size=80&background=2a5298&color=fff&rounded=true&bold=true`;

  return (
    <aside className="panel-sidebar" aria-label="Menú de administración">
      <div className="sidebar-brand">
        <span>Panel de control</span>
        <h3>Administrador</h3>
      </div>

      <div className="sidebar-user">
        <img src={avatarUrl} alt="" aria-hidden="true" />
        <div className="sidebar-user-info">
          <strong>{usuario?.nombre ?? 'Administrador'}</strong>
          <span>Administrador</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Secciones del panel">
        {ENLACES_ADMIN.map(({ to, texto, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon className="nav-icon" />
            {texto}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={salir}
          style={{
            marginTop: '0.5rem',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            paddingTop: '0.75rem',
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '0.5rem',
            background: 'transparent',
            border: 'none',
            paddingLeft: '0.75rem',
            paddingRight: '0.75rem',
            paddingBottom: '0.625rem',
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.65)',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
        >
          <LogOut className="nav-icon" />
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
