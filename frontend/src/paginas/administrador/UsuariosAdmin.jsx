import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Users, UserPlus, Pencil, Trash2, RefreshCw, Search } from 'lucide-react';
import * as usuariosServicio from '../../servicios/usuarios.servicio';
import Modal from '../../componentes/comunes/Modal';
import { useToast } from '../../contexto/ToastContext';

const ROLES = ['cliente', 'asesor', 'administrador'];
const ROL_CLASE = { administrador: 'badge-rol-admin', asesor: 'badge-rol-asesor', cliente: 'badge-rol-cliente' };

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const toast = useToast();

  const formCrear = useForm();
  const formEditar = useForm();

  const cargarUsuarios = async () => {
    setCargando(true);
    const { usuarios: lista } = await usuariosServicio.listarUsuarios();
    setUsuarios(lista);
    setCargando(false);
  };
  useEffect(() => { cargarUsuarios(); }, []);

  const crear = async (datos) => {
    try {
      await usuariosServicio.crearConRol(datos);
      formCrear.reset();
      setModalCrearAbierto(false);
      await cargarUsuarios();
      toast.exito('Usuario creado correctamente.');
    } catch (e) {
      toast.error(e.response?.data?.mensaje || 'No se pudo crear el usuario.');
    }
  };

  const abrirEditar = (usuario) => {
    setUsuarioEditando(usuario);
    formEditar.reset({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      telefono: usuario.telefono,
    });
  };

  const guardarEdicion = async (datos) => {
    try {
      await usuariosServicio.actualizarUsuarioAdmin(usuarioEditando.id ?? usuarioEditando._id, datos);
      setUsuarioEditando(null);
      await cargarUsuarios();
      toast.exito('Usuario actualizado correctamente.');
    } catch (e) {
      toast.error(e.response?.data?.mensaje || 'No se pudo actualizar el usuario.');
    }
  };

  const cambiarRol = async (id, rol) => {
    try {
      await usuariosServicio.cambiarRol(id, rol);
      await cargarUsuarios();
      toast.exito('Rol actualizado correctamente.');
    } catch (e) {
      toast.error(e.response?.data?.mensaje || 'No se pudo cambiar el rol.');
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await usuariosServicio.cambiarEstado(id, estado);
      await cargarUsuarios();
      toast.exito(estado === 'activo' ? 'Usuario activado.' : 'Usuario desactivado.');
    } catch (e) {
      toast.error(e.response?.data?.mensaje || 'No se pudo cambiar el estado.');
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await usuariosServicio.eliminarUsuario(id);
      await cargarUsuarios();
      toast.exito('Usuario eliminado correctamente.');
    } catch (e) {
      toast.error(e.response?.data?.mensaje || 'No se pudo eliminar el usuario.');
    }
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
        <button type="button" className="btn-panel-primary" onClick={() => setModalCrearAbierto(true)}>
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

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
                    <div className="row-actions">
                      <button type="button" className="btn-icon btn-icon--edit" title="Editar" onClick={() => abrirEditar(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={u.estado === 'activo' ? 'btn-icon btn-icon--danger' : 'btn-icon btn-icon--success'}
                        onClick={() => cambiarEstado(u.id ?? u._id, u.estado === 'activo' ? 'inactivo' : 'activo')}
                        title={u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      >
                        {u.estado === 'activo' ? '✕' : '✓'}
                      </button>
                      <button type="button" className="btn-icon btn-icon--danger" title="Eliminar" onClick={() => eliminar(u.id ?? u._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: crear usuario */}
      <Modal abierto={modalCrearAbierto} onCerrar={() => setModalCrearAbierto(false)} titulo="Crear usuario">
        <form onSubmit={formCrear.handleSubmit(crear)} className="form-grid">
          <div className="form-group"><label>Nombre</label><input {...formCrear.register('nombre', { required: true })} /></div>
          <div className="form-group"><label>Apellido</label><input {...formCrear.register('apellido', { required: true })} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Correo</label><input type="email" {...formCrear.register('correo', { required: true })} /></div>
          <div className="form-group"><label>Contraseña</label><input type="password" {...formCrear.register('contrasena', { required: true, minLength: 8 })} /></div>
          <div className="form-group">
            <label>Rol</label>
            <select {...formCrear.register('rol', { required: true })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-panel-primary">Crear usuario</button>
            <button type="button" onClick={() => setModalCrearAbierto(false)} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: editar usuario */}
      <Modal abierto={Boolean(usuarioEditando)} onCerrar={() => setUsuarioEditando(null)} titulo="Editar usuario">
        <form onSubmit={formEditar.handleSubmit(guardarEdicion)} className="form-grid">
          <div className="form-group"><label>Nombre</label><input {...formEditar.register('nombre', { required: true })} /></div>
          <div className="form-group"><label>Apellido</label><input {...formEditar.register('apellido')} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Correo</label><input type="email" {...formEditar.register('correo', { required: true })} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Teléfono</label><input {...formEditar.register('telefono')} /></div>
          <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-panel-primary">Guardar cambios</button>
            <button type="button" onClick={() => setUsuarioEditando(null)} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
