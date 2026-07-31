import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';

export default function RutaPorRol({ rolesPermitidos }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
