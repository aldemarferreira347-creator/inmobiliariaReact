import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Users, UserPlus, RefreshCw, Search } from 'lucide-react';
import * as usuariosServicio from '../../servicios/usuarios.servicio';

const ROLES = ['cliente', 'asesor', 'administrador'];
const ROL_CLASE = { administrador: 'badge-rol-admin', asesor: 'badge-rol-asesor', cliente: 'badge-rol-cliente' };

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje,  setMensaje]  = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const cargarUsuarios = async () => {
    setCargando(true);
    const { usuarios: lista } = await usuariosServicio.listarUsuarios();
    setUsuarios(lista);
    setCargando(false);
  };
  useEffect(() => { cargarUsuarios(); }, []);

  const crear = async (datos) => {
    setMensaje(null);
    try {
      await usuariosServicio.crearConRol(datos);
      reset();
      setMostrarForm(false);
      await cargarUsuarios();
      setMensaje({ tipo: 'success', texto: 'Usuario creado correctamente.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.response?.data?.mensaje || 'No se pudo crear el usuario.' });
    }
  };

  const cambiarRol = async (id, rol) => {
    await usuariosServicio.cambiarRol(id, rol);
    await cargarUsuarios();
  };
  const cambiarEstado = async (id, estado) => {
    await usuariosServicio.cambiarEstado(id, estado);
    await cargarUsuarios();
  };

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return !q || `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) || u.correo?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Gestión de usuarios
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            {usuarios.length} usuario(s) registrados
          </p>
        </div>
        <button type="button" className="btn-panel-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          <UserPlus className="h-4 w-4" /> {mostrarForm ? 'Cancelar' : 'Nuevo usuario'}
        </button>
      </div>

      {mensaje && (
        <div className={`alert ${mensaje.tipo}`} style={{ marginBottom: '1rem' }}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario crear */}
      {mostrarForm && (
        <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus style={{ width: 16, height: 16, color: 'var(--color-navy-500)' }} /> Crear usuario
          </h2>
          <form onSubmit={handleSubmit(crear)} className="form-grid">
            <div className="form-group"><label>Nombre</label><input {...register('nombre', { required: true })} /></div>
            <div className="form-group"><label>Apellido</label><input {...register('apellido', { required: true })} /></div>
            <div className="form-group"><label>Correo</label><input type="email" {...register('correo', { required: true })} /></div>
            <div className="form-group"><label>Contraseña</label><input type="password" {...register('contrasena', { required: true, minLength: 8 })} /></div>
            <div className="form-group">
              <label>Rol</label>
              <select {...register('rol', { required: true })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-panel-primary">Crear usuario</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="table-responsive">
        <div className="tbl-toolbar" style={{ padding: '0.75rem 1rem' }}>
          <div className="tbl-search">
            <Search style={{ width: 15, height: 15 }} />
            <input type="text" placeholder="Buscar por nombre o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <button type="button" className="tbl-btn" onClick={cargarUsuarios} title="Recargar">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando usuarios...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(15,23,42,0.4)' }}>No hay usuarios que mostrar.</td></tr>
              ) : filtrados.map((u) => (
                <tr key={u.id ?? u._id}>
                  <td>
                    <span className="td-title">{u.nombre} {u.apellido}</span>
                  </td>
                  <td className="td-subtitle" style={{ color: 'rgba(15,23,42,0.55)', fontSize: '0.8125rem' }}>{u.correo}</td>
                  <td>
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u.id ?? u._id, e.target.value)}
                      className={`badge ${ROL_CLASE[u.rol] ?? ''}`}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={u.estado === 'activo' ? 'accent-green' : 'accent-red'}>
                      {u.estado ?? 'activo'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={u.estado === 'activo' ? 'btn-icon btn-icon--danger' : 'btn-icon btn-icon--success'}
                      onClick={() => cambiarEstado(u.id ?? u._id, u.estado === 'activo' ? 'inactivo' : 'activo')}
                      title={u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    >
                      {u.estado === 'activo' ? '✕' : '✓'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
