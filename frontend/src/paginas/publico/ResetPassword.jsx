import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Building2, KeyRound, AlertCircle } from 'lucide-react';
import * as authServicio from '../../servicios/auth.servicio';

export default function ResetPassword() {
  const { token } = useParams();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (datos) => {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      await authServicio.resetearPassword(token, datos.contrasenaNueva);
      navigate('/login');
    } catch (error) {
      setErrorGeneral(error.response?.data?.mensaje || 'El enlace es inválido o expiró.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="logo-badge"><Building2 className="h-5 w-5" /></span>
          García Inmobiliaria
        </div>

        <h1>Restablecer contraseña</h1>
        <p className="auth-subtitle">
          Ingresa tu nueva contraseña para acceder a tu cuenta.
        </p>

        {errorGeneral && (
          <div className="auth-alert error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorGeneral}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-field">
            <label htmlFor="contrasenaNueva">Nueva contraseña</label>
            <input
              id="contrasenaNueva"
              type="password"
              placeholder="Mínimo 8 caracteres (A-Z, a-z, 0-9, @#$)"
              {...register('contrasenaNueva', { required: true, minLength: 8 })}
            />
            {errors.contrasenaNueva && (
              <span className="error-campo">La contraseña debe tener mínimo 8 caracteres</span>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={enviando}>
            {enviando ? (
              <><span className="spinner" /> Guardando...</>
            ) : (
              <><KeyRound className="h-4 w-4" /> Guardar nueva contraseña</>
            )}
          </button>
        </form>

        <p className="auth-footer-link">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
