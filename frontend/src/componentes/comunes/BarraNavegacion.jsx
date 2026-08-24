import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Menu, X, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../contexto/AuthContext';
import CampanaNotificaciones from '../notificaciones/CampanaNotificaciones';

const PANEL_POR_ROL = {
  administrador: { to: '/administrador', texto: 'Panel Admin' },
  asesor:        { to: '/asesor',        texto: 'Panel Asesor' },
};

export default function BarraNavegacion() {
  const { usuario, estaAutenticado, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const panel = PANEL_POR_ROL[usuario?.rol] ?? { to: '/perfil', texto: 'Perfil' };

  const salir = async () => {
    await cerrarSesion();
    navigate('/login');
  };

  const closeMenu = () => setMenuAbierto(false);

  // Helper para simular el pagina_activa del PHP
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header>
      <div className="container">
        <nav aria-label="Navegación principal">
          {/* Logo */}
          <NavLink to="/" className="logo" onClick={closeMenu}>
            <span className="logo-badge">
              <Building2 className="h-5 w-5" />
            </span>
            García Inmobiliaria
          </NavLink>

          {/* Hamburguesa (mobile) */}
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Abrir menu"
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Links de navegación (igual al PHP) */}
          <ul className={`nav-links ${menuAbierto ? 'is-open' : ''}`} id="navLinks">
            <li>
              <NavLink to="/" className={isActive('/')} onClick={closeMenu}>
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink to="/catalogo" className={isActive('/catalogo')} onClick={closeMenu}>
                Inmuebles
              </NavLink>
            </li>
            <li>
              <NavLink to="/notificaciones" className={isActive('/notificaciones')} onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Notificaciones
                {estaAutenticado && (
                  <span className="nav-badge hidden" data-notif-badge>0</span>
                )}
              </NavLink>
            </li>
            
            {estaAutenticado && (
              <li>
                <NavLink to="/mensajes" className={isActive('/mensajes')} onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Mensajes
                  <span className="nav-badge hidden" data-msg-badge>0</span>
                </NavLink>
              </li>
            )}

            {estaAutenticado && (
              <li>
                <NavLink to={panel.to} className={location.pathname.startsWith(panel.to) ? 'active' : ''} onClick={closeMenu}>
                  {panel.texto}
                </NavLink>
              </li>
            )}

            {estaAutenticado ? (
              <li>
                <button type="button" onClick={salir} className="btn-primary btn-nav-logout" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </li>
            ) : (
              <>
                <li>
                  <NavLink to="/registro" className={isActive('/registro')} onClick={closeMenu}>
                    Registrarse
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/login" className={`btn-primary ${isActive('/login')}`} onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LogIn className="h-4 w-4" /> Iniciar sesión
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
