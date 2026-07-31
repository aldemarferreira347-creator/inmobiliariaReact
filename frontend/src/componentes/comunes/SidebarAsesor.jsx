import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, DollarSign, Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexto/AuthContext';

const ENLACES_ASESOR = [
  { to: '/asesor/mensajes', texto: 'Mensajes',      Icon: MessageSquare },
  { to: '/asesor/citas',    texto: 'Mis Citas',     Icon: Calendar },
  { to: '/asesor/ventas',   texto: 'Mis Ventas',    Icon: DollarSign },
  { to: '/notificaciones',  texto: 'Notificaciones',Icon: Bell },
  { to: '/catalogo',        texto: 'Ver catálogo',  Icon: Search },
  { to: '/perfil',          texto: 'Mi Perfil',     Icon: User },
];

export default function SidebarAsesor({ mostrarVolver = false }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await cerrarSesion();
    navigate('/login');
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre ?? 'Asesor')}&size=80&background=276749&color=fff&rounded=true&bold=true`;

  return (
    <aside className="panel-sidebar" aria-label="Menú de asesor">
      <div className="sidebar-brand">
        <span>Panel de asesor</span>
        <h3>Asesor</h3>
      </div>

      <div className="sidebar-user">
        <img src={avatarUrl} alt="" aria-hidden="true" />
        <div className="sidebar-user-info">
          <strong>{usuario?.nombre ?? 'Asesor'}</strong>
          <span>Asesor inmobiliario</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Secciones del panel">
        {ENLACES_ASESOR.map(({ to, texto, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon className="nav-icon" />
            {texto}
          </NavLink>
        ))}

        {mostrarVolver && (
          <NavLink to="/administrador/inmuebles" className="nav-link-admin">
            <Settings className="nav-icon" />
            Volver a Panel Admin
          </NavLink>
        )}

        <button
          type="button"
          onClick={salir}
          style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: '0.75rem' }}
          className="!flex !w-full !items-center !gap-2 !rounded-lg !bg-transparent !px-3 !py-2.5 !text-sm !text-white/65 !transition hover:!bg-white/10 hover:!text-white"
        >
          <LogOut className="nav-icon" />
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
