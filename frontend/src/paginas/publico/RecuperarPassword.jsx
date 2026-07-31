import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Building2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import * as authServicio from '../../servicios/auth.servicio';

export default function RecuperarPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [mensaje, setMensaje] = useState(null);
  const [esError, setEsError] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (datos) => {
    setEnviando(true);
    setEsError(false);
    try {
      const respuesta = await authServicio.recuperarPassword(datos.correo);
      setMensaje(respuesta.mensaje ?? 'Si el correo está registrado, recibirás el enlace de recuperación.');
    } catch (error) {
      setEsError(true);
      setMensaje(error.response?.data?.mensaje || 'Ocurrió un error, intenta de nuevo.');
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

        <h1>Recuperar contraseña</h1>
        <p className="auth-subtitle">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {mensaje && (
          <div className={`auth-alert ${esError ? 'error' : 'success'}`}>
            {esError
              ? <AlertCircle className="h-4 w-4 shrink-0" />
              : <CheckCircle className="h-4 w-4 shrink-0" />}
            {mensaje}
          </div>
        )}

        {!mensaje && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                placeholder="tu@correo.com"
                {...register('correo', { required: true })}
              />
              {errors.correo && <span className="error-campo">El correo es obligatorio</span>}
            </div>

            <button type="submit" className="auth-submit" disabled={enviando}>
              {enviando ? (
                <><span className="spinner" /> Enviando...</>
              ) : (
                <><Mail className="h-4 w-4" /> Enviar enlace de recuperación</>
              )}
            </button>
          </form>
        )}

        <p className="auth-footer-link">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
