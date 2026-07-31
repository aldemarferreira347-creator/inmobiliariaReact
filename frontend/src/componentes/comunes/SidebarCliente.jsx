import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  User, Home, ClipboardList, Tag, Calendar,
  Star, CreditCard, Bell, LogOut, Camera
} from 'lucide-react';
import { useAuth } from '../../contexto/AuthContext';
import * as usuariosServicio from '../../servicios/usuarios.servicio';
import { urlArchivo } from '../../utilidades/urlArchivo';

const ENLACES_CLIENTE_SIDEBAR = [
  { to: '/perfil',          texto: 'Mi perfil',       Icon: User },
  { to: '/mis-arriendos',   texto: 'Mis arriendos',   Icon: Home },
  { to: '/reservas',        texto: 'Mis reservas',    Icon: ClipboardList },
  { to: '/mis-compras',     texto: 'Mis compras',     Icon: Tag },
  { to: '/mis-citas',       texto: 'Mis citas',       Icon: Calendar },
  { to: '/favoritos',       texto: 'Mis favoritos',   Icon: Star },
  { to: '/tarjetas',        texto: 'Mis tarjetas',    Icon: CreditCard },
  { to: '/notificaciones',  texto: 'Notificaciones',  Icon: Bell },
];

export default function SidebarCliente() {
  const { usuario, cerrarSesion, recargarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const salir = async () => {
    await cerrarSesion();
    navigate('/login');
  };

  const subirFoto = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      await usuariosServicio.subirFotoPerfil(archivo);
      await recargarSesion();
    } catch (error) {
      console.error('Error al subir foto:', error);
    }
  };

  const fotoSrc = usuario?.fotoPerfilUrl ? urlArchivo(usuario.fotoPerfilUrl) : null;
  const avatarLetras = `${usuario?.nombre?.[0] ?? ''}${usuario?.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <aside className="perfil-sidebar" style={{ minWidth: 260, maxWidth: 260, height: 'max-content' }}>
      <div className="perfil-avatar">
        <div className="avatar-wrapper">
          {fotoSrc
            ? <img src={fotoSrc} alt="Foto de perfil" className="avatar-wrapper img" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover' }} />
            : <div className="avatar-placeholder" style={{ width: 90, height: 90, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', fontSize: 32, color: '#0f1e4a', fontWeight: '600' }}>{avatarLetras}</div>}
          <label htmlFor="foto-input" className="avatar-change-btn" title="Cambiar foto">
            <Camera className="h-4 w-4" />
          </label>
          <input id="foto-input" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }}
            onChange={subirFoto} />
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <strong style={{ display: 'block', fontWeight: 600, fontSize: '1rem', color: '#0f1e4a' }}>
            {usuario?.nombre} {usuario?.apellido}
          </strong>
          <span className="user-role" style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.25rem 0.75rem', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: 999, fontSize: '0.75rem', fontWeight: 500 }}>
            {usuario?.rol || 'Cliente'}
          </span>
        </div>
      </div>

      <nav className="perfil-menu" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {ENLACES_CLIENTE_SIDEBAR.map(({ to, texto, Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={isActive ? 'active' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: '0.5rem', color: isActive ? '#0f1e4a' : '#475569',
                backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: isActive ? 600 : 400
              }}
            >
              <Icon className="h-4 w-4" style={{ color: isActive ? '#f59e0b' : 'inherit' }} />
              {texto}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={salir}
          style={{ 
            marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ef4444', fontSize: '0.875rem', fontWeight: 500
          }}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
