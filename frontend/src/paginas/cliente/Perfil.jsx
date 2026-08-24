import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, KeyRound, CheckCircle, AlertCircle, Edit, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexto/AuthContext';
import * as usuariosServicio from '../../servicios/usuarios.servicio';
import * as reservasServicio from '../../servicios/reservas.servicio';
import * as mensajesServicio from '../../servicios/mensajes.servicio';
import * as notificacionesServicio from '../../servicios/notificaciones.servicio';

// ── Sub-componente: formulario cambio de contraseña con indicadores de fortaleza ──
const REGLAS_PASSWORD = [
  { key: 'length',  label: 'Mínimo 8 caracteres',           test: (v) => v.length >= 8 },
  { key: 'upper',   label: 'Al menos 1 mayúscula',          test: (v) => /[A-Z]/.test(v) },
  { key: 'lower',   label: 'Al menos 1 minúscula',          test: (v) => /[a-z]/.test(v) },
  { key: 'number',  label: 'Al menos 1 número',             test: (v) => /[0-9]/.test(v) },
  { key: 'symbol',  label: 'Al menos 1 símbolo (!@#$%...)', test: (v) => /[\W_]/.test(v) },
];

function PasswordForm({ onGuardar, onCancelar }) {
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm();
  const [showActual, setShowActual] = useState(false);
  const [showNueva,  setShowNueva]  = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [error, setError] = useState(null);

  const nueva    = watch('contrasenaNueva', '');
  const confirma = watch('confirmar', '');
  const coincide = nueva === confirma && nueva.length > 0;
  const reglasOk = REGLAS_PASSWORD.every((r) => r.test(nueva));
  const puedeEnviar = reglasOk && coincide && !isSubmitting;

  const enviar = async (datos) => {
    setError(null);
    if (!coincide) { setError('Las contraseñas no coinciden.'); return; }
    try {
      await onGuardar({ contrasenaActual: datos.contrasenaActual, contrasenaNueva: datos.contrasenaNueva });
    } catch {
      // el error lo maneja el padre
    }
  };

  return (
    <form onSubmit={handleSubmit(enviar)} style={{ marginTop: '1.5rem', maxWidth: 420 }}>

      {/* Contraseña actual */}
      <div className="form-group">
        <label htmlFor="contrasenaActual">Contraseña actual</label>
        <div style={{ position: 'relative' }}>
          <input
            id="contrasenaActual"
            type={showActual ? 'text' : 'password'}
            style={{ paddingRight: '2.5rem' }}
            {...register('contrasenaActual', { required: true })}
          />
          <button type="button" onClick={() => setShowActual((p) => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Nueva contraseña */}
      <div className="form-group">
        <label htmlFor="contrasenaNueva">Nueva contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            id="contrasenaNueva"
            type={showNueva ? 'text' : 'password'}
            style={{ paddingRight: '2.5rem' }}
            {...register('contrasenaNueva', { required: true })}
          />
          <button type="button" onClick={() => setShowNueva((p) => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {/* Indicadores de fortaleza */}
        {nueva.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {REGLAS_PASSWORD.map((r) => {
              const ok = r.test(nueva);
              return (
                <li key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: ok ? '#22c55e' : '#e2e8f0', transition: 'background 0.2s', border: `1px solid ${ok ? '#16a34a' : '#cbd5e1'}` }} />
                  <span style={{ color: ok ? '#166534' : '#64748b' }}>{r.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Confirmar contraseña */}
      <div className="form-group">
        <label htmlFor="confirmar">Confirmar nueva contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            id="confirmar"
            type={showConf ? 'text' : 'password'}
            style={{ paddingRight: '2.5rem', borderColor: confirma.length > 0 && !coincide ? '#ef4444' : undefined }}
            {...register('confirmar', { required: true })}
          />
          <button type="button" onClick={() => setShowConf((p) => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirma.length > 0 && !coincide && (
          <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>Las contraseñas no coinciden.</span>
        )}
      </div>

      {error && (
        <div style={{ fontSize: '0.875rem', color: '#991b1b', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '0.625rem 0.875rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <AlertCircle className="h-4 w-4 shrink-0" style={{ marginTop: 1 }} />
          {error}
        </div>
      )}

      <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.5rem', display: 'flex', gap: '0.4rem' }}>
        <ShieldCheck className="h-4 w-4 shrink-0" style={{ marginTop: 1 }} />
        Por seguridad, te enviaremos un enlace de confirmación a tu correo antes de aplicar el cambio.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="btn-panel-primary" disabled={!puedeEnviar}>
          {isSubmitting ? 'Enviando...' : 'Solicitar cambio de contraseña'}
        </button>
        <button type="button" onClick={onCancelar} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function Perfil() {
  const { usuario, recargarSesion } = useAuth();
  
  // Modos de vista: 'ver', 'editar_datos', 'editar_password'
  const [modo, setModo] = useState('ver');
  const [stats, setStats] = useState({ reservas: 0, notificaciones: 0, mensajes: 0 });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { nombre: usuario?.nombre, apellido: usuario?.apellido, telefono: usuario?.telefono, direccion: usuario?.direccion, ciudad: usuario?.ciudad, fechaNacimiento: usuario?.fechaNacimiento ? usuario.fechaNacimiento.split('T')[0] : '' },
  });

  const [msgPerfil, setMsgPerfil] = useState(null);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const [resRes, resNotif, resMsg] = await Promise.all([
          reservasServicio.misReservas().catch(() => ({ reservas: [] })),
          notificacionesServicio.contador().catch(() => ({ cantidad: 0 })),
          mensajesServicio.noLeidosContador().catch(() => ({ cantidad: 0 }))
        ]);
        setStats({
          reservas: resRes.reservas?.length || 0,
          notificaciones: resNotif.cantidad || 0,
          mensajes: resMsg.cantidad || 0
        });
      } catch (error) {
        console.error('Error loading stats', error);
      }
    };
    cargarStats();
  }, []);

  const guardar = async (datos) => {
    setMsgPerfil(null);
    try {
      await usuariosServicio.actualizarPerfil(datos);
      await recargarSesion();
      setMsgPerfil({ tipo: 'success', texto: 'Perfil actualizado correctamente.' });
      setModo('ver');
    } catch (e) {
      setMsgPerfil({ tipo: 'error', texto: e.response?.data?.mensaje || 'No se pudo actualizar el perfil.' });
    }
  };

  const cambiarPass = async (datos) => {
    setMsgPerfil(null);
    try {
      const r = await usuariosServicio.solicitarCambioContrasena(datos);
      setMsgPerfil({ tipo: 'success', texto: r.mensaje ?? 'Revisa tu correo para confirmar el cambio de contraseña.' });
      setModo('ver');
    } catch (e) {
      setMsgPerfil({ tipo: 'error', texto: e.response?.data?.mensaje || 'No se pudo solicitar el cambio de contraseña.' });
      throw e; // re-lanzar para que PasswordForm pueda capturar si es necesario
    }
  };

  if (!usuario) return null;

  const Alerta = ({ msg }) => msg && (
    <div className={`auth-alert ${msg.tipo}`} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: msg.tipo === 'success' ? '#f0fdf4' : '#fef2f2', color: msg.tipo === 'success' ? '#166534' : '#991b1b', border: `1px solid ${msg.tipo === 'success' ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {msg.tipo === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {msg.texto}
    </div>
  );

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Tarjetas Superiores */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Reservas', value: stats.reservas },
          { label: 'Notificaciones', value: stats.notificaciones },
          { label: 'Mensajes', value: stats.mensajes }
        ].map((stat) => (
          <div key={stat.label} className="panel-card" style={{ flex: '1 1 200px', textAlign: 'center', padding: '1.5rem 1rem' }}>
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.25rem', color: '#0f1e4a' }}>{stat.value}</h2>
            <span style={{ fontSize: '0.875rem', color: '#475569' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      <Alerta msg={msgPerfil} />

      {/* Información Personal */}
      <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.125rem' }}>
            <User className="h-5 w-5" style={{ color: '#64748b' }} /> Información personal
          </h3>
          {modo === 'ver' && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setModo('editar_password')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
                <KeyRound className="h-4 w-4" /> Cambiar contraseña
              </button>
              <button onClick={() => setModo('editar_datos')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
                <Edit className="h-4 w-4" /> Editar
              </button>
            </div>
          )}
        </div>

        {modo === 'ver' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre Completo</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{usuario.nombre} {usuario.apellido || ''}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correo electrónico</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{usuario.correo}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{usuario.telefono || '—'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha de nacimiento</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{usuario.fechaNacimiento ? new Date(usuario.fechaNacimiento).toLocaleDateString('es-CO') : '—'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ciudad</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{usuario.ciudad || '—'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{usuario.direccion || '—'}</p>
            </div>
          </div>
        )}

        {modo === 'editar_datos' && (
          <form onSubmit={handleSubmit(guardar)} style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre</label>
                <input id="nombre" {...register('nombre', { required: true })} />
              </div>
              <div className="form-group">
                <label htmlFor="apellido">Apellido</label>
                <input id="apellido" {...register('apellido')} />
              </div>
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input id="telefono" {...register('telefono')} />
              </div>
              <div className="form-group">
                <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
                <input id="fechaNacimiento" type="date" {...register('fechaNacimiento')} />
              </div>
              <div className="form-group">
                <label htmlFor="ciudad">Ciudad</label>
                <input id="ciudad" {...register('ciudad')} />
              </div>
              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                <input id="direccion" {...register('direccion')} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn-panel-primary">Guardar cambios</button>
              <button type="button" onClick={() => { reset(); setModo('ver'); }} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        )}

        {modo === 'editar_password' && (
          <PasswordForm onGuardar={cambiarPass} onCancelar={() => { setModo('ver'); }} />
        )}
      </div>

      {/* Documento de Identidad */}
      <div className="panel-card">
        <div className="panel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.125rem' }}>
            <ShieldCheck className="h-5 w-5" style={{ color: '#3b82f6' }} /> Documento de identidad
          </h3>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Solo lectura
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de documento</span>
            <p style={{ margin: '0.25rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{usuario.documentoTipo || '—'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Número de documento</span>
            <p style={{ margin: '0.25rem 0 0', fontWeight: 500, fontSize: '0.9375rem', color: '#1e293b' }}>{usuario.documentoNumero || '—'}</p>
          </div>
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: '#64748b', margin: '1.5rem 0 0' }}>
          Por integridad legal, el documento de identidad no puede modificarse desde aquí. Si necesitas corregirlo, contacta a soporte.
        </p>
      </div>

    </div>
  );
}
