import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import * as authServicio from '../../servicios/auth.servicio';

export default function ConfirmarCambioPassword() {
  const { token } = useParams();
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'exito' | 'error'
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;
    authServicio.confirmarCambioPassword(token)
      .then((r) => {
        if (!activo) return;
        setEstado('exito');
        setMensaje(r.mensaje ?? 'Tu contraseña fue cambiada correctamente.');
      })
      .catch((error) => {
        if (!activo) return;
        setEstado('error');
        setMensaje(error.response?.data?.mensaje || 'El enlace es inválido, ya fue utilizado o expiró.');
      });
    return () => { activo = false; };
  }, [token]);

  return (
    <div className="auth-shell">
      <div className="pagina-formulario" style={{ textAlign: 'center' }}>
        {estado === 'cargando' && (
          <>
            <Loader className="h-10 w-10 animate-spin" style={{ margin: '0 auto 1rem' }} />
            <h1>Confirmando cambio...</h1>
            <p>Estamos validando tu enlace, un momento.</p>
          </>
        )}
        {estado === 'exito' && (
          <>
            <CheckCircle className="h-10 w-10" style={{ margin: '0 auto 1rem', color: '#166534' }} />
            <h1>¡Contraseña actualizada!</h1>
            <p>{mensaje}</p>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem' }}>
              Ir a iniciar sesión
            </Link>
          </>
        )}
        {estado === 'error' && (
          <>
            <XCircle className="h-10 w-10" style={{ margin: '0 auto 1rem', color: '#991b1b' }} />
            <h1>Enlace inválido o expirado</h1>
            <p>{mensaje}</p>
            <Link to="/perfil" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem' }}>
              Volver a mi perfil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
