import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexto/AuthContext';

const RUTA_INICIO_POR_ROL = {
  cliente:        '/',
  asesor:         '/asesor',
  administrador:  '/administrador',
};

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (datos) => {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const usuario = await iniciarSesion(datos);
      const destino = location.state?.from || RUTA_INICIO_POR_ROL[usuario.rol] || '/';
      navigate(destino, { replace: true });
    } catch (error) {
      setErrorGeneral(error.response?.data?.mensaje || 'No se pudo iniciar sesión. Verifica tus credenciales.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Marca */}
        <div className="auth-brand">
          <span className="logo-badge"><Building2 className="h-5 w-5" /></span>
          García Inmobiliaria
        </div>

        <h1>Iniciar sesión</h1>
        <p className="auth-subtitle">Accede a tu cuenta para gestionar tus propiedades.</p>

        {errorGeneral && (
          <div className="auth-alert error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorGeneral}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              {...register('email', { required: true })}
            />
            {errors.email && <span className="error-campo">El correo es obligatorio</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              placeholder="••••••••"
              {...register('contrasena', { required: true })}
            />
            {errors.contrasena && <span className="error-campo">La contraseña es obligatoria</span>}
          </div>

          <button type="submit" className="auth-submit" disabled={enviando}>
            {enviando ? (
              <><span className="spinner" /> Ingresando...</>
            ) : (
              <><LogIn className="h-4 w-4" /> Ingresar</>
            )}
          </button>
        </form>

        <p className="auth-footer-link">
          <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="auth-footer-link" style={{ marginTop: '0.5rem' }}>
          ¿No tienes cuenta? <Link to="/registro">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
}
