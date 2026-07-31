import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Megaphone, Send, CheckCircle, AlertCircle } from 'lucide-react';
import * as notificacionesServicio from '../../servicios/notificaciones.servicio';
import * as usuariosServicio from '../../servicios/usuarios.servicio';

export default function AdminNotificaciones() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ defaultValues: { destino: 'todos' } });
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  
  const destino = watch('destino');

  useEffect(() => {
    usuariosServicio.listarUsuarios().then((data) => setUsuarios(data.usuarios ?? []));
  }, []);

  const enviar = async (datos) => {
    setMensaje(null);
    setEnviando(true);
    try {
      await notificacionesServicio.enviarBroadcast(datos);
      setMensaje({ tipo: 'success', texto: 'Notificación enviada correctamente.' });
      reset({ destino: 'todos', usuarioId: '', titulo: '', mensaje: '' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.mensaje || 'No se pudo enviar la notificación.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Enviar Notificación
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            Envía mensajes a un usuario específico o a todos los activos.
          </p>
        </div>
      </div>

      <div className="panel-card" style={{ maxWidth: 600 }}>
        {mensaje && (
          <div className={`alert ${mensaje.tipo}`} style={{ marginBottom: '1.5rem' }}>
            {mensaje.tipo === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit(enviar)} className="form-grid">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Destinatario</label>
            <select {...register('destino')}>
              <option value="todos">Todos los usuarios activos</option>
              <option value="individual">Usuario específico</option>
            </select>
          </div>

          {destino === 'individual' && (
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Seleccionar Usuario</label>
              <select {...register('usuarioId', { required: destino === 'individual' })}>
                <option value="">Elige un usuario de la lista</option>
                {usuarios.map((u) => (
                  <option key={u.id ?? u._id} value={u.id ?? u._id}>{u.nombre} {u.apellido} ({u.rol})</option>
                ))}
              </select>
              {errors.usuarioId && <span className="error-campo">Selecciona un usuario</span>}
            </div>
          )}

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Título de la notificación</label>
            <input 
              {...register('titulo', { required: true })} 
              placeholder="Ej: Mantenimiento programado"
            />
            {errors.titulo && <span className="error-campo">El título es obligatorio</span>}
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Mensaje</label>
            <textarea 
              rows={4} 
              {...register('mensaje', { required: true })} 
              placeholder="Escribe el contenido del mensaje aquí..."
            />
            {errors.mensaje && <span className="error-campo">El mensaje es obligatorio</span>}
          </div>

          <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              type="submit" 
              className="btn-panel-primary" 
              disabled={enviando}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {enviando ? 'Enviando...' : <><Send className="h-4 w-4" /> Enviar notificación</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
