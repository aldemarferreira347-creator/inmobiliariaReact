import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, CheckCircle, XCircle, Loader } from 'lucide-react';
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
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand" style={{ justifyContent: 'center' }}>
          <span className="logo-badge"><Building2 className="h-5 w-5" /></span>
          García Inmobiliaria
        </div>

        {estado === 'cargando' && (
          <div style={{ padding: '1rem 0' }}>
            <Loader className="h-10 w-10 animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--color-navy-500)' }} />
            <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Confirmando cambio...</h1>
            <p className="auth-subtitle">Estamos validando tu enlace de seguridad, un momento.</p>
          </div>
        )}

        {estado === 'exito' && (
          <div style={{ padding: '1rem 0' }}>
            <CheckCircle className="h-12 w-12" style={{ margin: '0 auto 1rem', color: '#16a34a' }} />
            <h1 style={{ fontSize: '1.375rem', marginBottom: '0.5rem', color: '#166534' }}>¡Contraseña actualizada!</h1>
            <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>{mensaje}</p>
            <Link to="/login" className="auth-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              Iniciar sesión ahora
            </Link>
          </div>
        )}

        {estado === 'error' && (
          <div style={{ padding: '1rem 0' }}>
            <XCircle className="h-12 w-12" style={{ margin: '0 auto 1rem', color: '#dc2626' }} />
            <h1 style={{ fontSize: '1.375rem', marginBottom: '0.5rem', color: '#991b1b' }}>Enlace no válido</h1>
            <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>{mensaje}</p>
            <Link to="/recuperar-password" className="auth-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              Solicitar nuevo enlace
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
