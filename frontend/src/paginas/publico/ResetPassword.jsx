import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
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
      setErrorGeneral(error.response?.data?.mensaje || 'El enlace es invalido o expiro');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="pagina-formulario">
        <h1>Restablecer contrasena</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="contrasenaNueva">Nueva contrasena</label>
            <input id="contrasenaNueva" type="password" {...register('contrasenaNueva', { required: true, minLength: 8 })} />
            {errors.contrasenaNueva && <span className="error-campo">Contrasena invalida</span>}
          </div>
          {errorGeneral && <p className="error-general">{errorGeneral}</p>}
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Restablecer contrasena'}
          </button>
        </form>
      </div>
    </div>
  );
}
