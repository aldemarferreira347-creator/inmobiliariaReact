import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';

export default function RutaPrivada() {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  return estaAutenticado ? <Outlet /> : <Navigate to="/login" replace />;
}
