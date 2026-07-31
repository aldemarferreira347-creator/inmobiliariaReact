import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexto/AuthContext';

export default function Registro() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { registrarse } = useAuth();
  const navigate = useNavigate();
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const onSubmit = async (datos) => {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      await registrarse(datos);
      setExito(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setErrorGeneral(error.response?.data?.mensaje || 'No se pudo completar el registro.');
    } finally {
      setEnviando(false);
    }
  };

  if (exito) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <CheckCircle style={{ width: 48, height: 48, color: '#059669', margin: '0 auto 1rem' }} />
          <h1 style={{ marginBottom: '0.5rem' }}>¡Registro exitoso!</h1>
          <p style={{ color: 'rgba(15,23,42,0.6)' }}>Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand">
          <span className="logo-badge"><Building2 className="h-5 w-5" /></span>
          García Inmobiliaria
        </div>

        <h1>Crear cuenta</h1>
        <p className="auth-subtitle">Regístrate gratis y accede al mejor catálogo de inmuebles.</p>

        {errorGeneral && (
          <div className="auth-alert error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorGeneral}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-row">
            <div className="auth-field">
              <label htmlFor="nombre">Nombre completo</label>
              <input id="nombre" type="text" placeholder="Tu nombre completo" {...register('nombre', { required: true })} />
              {errors.nombre && <span className="error-campo">El nombre es obligatorio</span>}
            </div>
            <div className="auth-field">
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" type="email" placeholder="tu@correo.com" {...register('email', { required: true })} />
              {errors.email && <span className="error-campo">El correo es obligatorio</span>}
            </div>
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label htmlFor="documento_tipo">Tipo de documento</label>
              <select id="documento_tipo" {...register('documento_tipo', { required: true })}>
                <option value="">Selecciona...</option>
                <option value="CC">Cédula de ciudadanía</option>
                <option value="CE">Cédula de extranjería</option>
                <option value="PA">Pasaporte</option>
              </select>
              {errors.documento_tipo && <span className="error-campo">El tipo de documento es obligatorio</span>}
            </div>
            <div className="auth-field">
              <label htmlFor="documento_numero">Número de documento</label>
              <input id="documento_numero" type="text" placeholder="1234567890" {...register('documento_numero', { required: true })} />
              {errors.documento_numero && <span className="error-campo">El número de documento es obligatorio</span>}
            </div>
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label htmlFor="telefono">Teléfono <span className="text-opcional">(opcional)</span></label>
              <input id="telefono" type="tel" placeholder="313 000 0000" {...register('telefono')} />
            </div>
            <div className="auth-field">
              <label htmlFor="fecha_nacimiento">Fecha de nacimiento <span className="text-opcional">(opcional)</span></label>
              <input id="fecha_nacimiento" type="date" {...register('fecha_nacimiento')} />
            </div>
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label htmlFor="ciudad">Ciudad <span className="text-opcional">(opcional)</span></label>
              <input id="ciudad" type="text" placeholder="Neiva" {...register('ciudad')} />
            </div>
            <div className="auth-field">
              <label htmlFor="direccion">Dirección <span className="text-opcional">(opcional)</span></label>
              <input id="direccion" type="text" placeholder="Calle 10 # 5-20" {...register('direccion')} />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              placeholder="Mínimo 8 caracteres"
              {...register('contrasena', { required: true, minLength: 8 })}
            />
            <small className="field-note">Debe incluir una mayúscula, una minúscula, un número y un carácter especial.</small>
            {errors.contrasena && <span className="error-campo">Contraseña inválida (mínimo 8 caracteres)</span>}
          </div>

          <button type="submit" className="auth-submit" disabled={enviando}>
            {enviando ? (
              <><span className="spinner" /> Creando cuenta...</>
            ) : (
              <><UserPlus className="h-4 w-4" /> Registrarme gratis</>
            )}
          </button>
        </form>

        <p className="auth-footer-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
