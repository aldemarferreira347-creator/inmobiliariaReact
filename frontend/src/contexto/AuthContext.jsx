import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authServicio from '../servicios/auth.servicio';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarSesion = useCallback(async () => {
    try {
      const { usuario: usuarioActual } = await authServicio.obtenerPerfil();
      setUsuario(usuarioActual);
    } catch (error) {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  const iniciarSesion = async (credenciales) => {
    const { usuario: usuarioActual } = await authServicio.login(credenciales);
    setUsuario(usuarioActual);
    return usuarioActual;
  };

  const registrarse = async (datos) => {
    return authServicio.registrar(datos);
  };

  const cerrarSesion = async () => {
    await authServicio.logout();
    setUsuario(null);
  };

  const valor = {
    usuario,
    cargando,
    estaAutenticado: Boolean(usuario),
    iniciarSesion,
    registrarse,
    cerrarSesion,
    recargarSesion: cargarSesion,
    setUsuario,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return contexto;
}
