import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import * as inmueblesServicio from '../../servicios/inmuebles.servicio';

const ESTADO_CLASE = {
  Disponible: 'accent-green',
  Reservado:  'accent-orange',
  Ocupado:    'accent-blue',
  Inactivo:   '',
};

export default function InmueblesAdmin() {
  const [resultado, setResultado] = useState({ inmuebles: [] });
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje,  setMensaje]  = useState(null);

  const cargar = async () => {
    setCargando(true);
    const data = await inmueblesServicio.listar({ limite: 100 });
    setResultado(data);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este inmueble?')) return;
    setMensaje(null);
    try {
      await inmueblesServicio.eliminar(id);
      await cargar();
      setMensaje({ tipo: 'success', texto: 'Inmueble eliminado correctamente.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.response?.data?.mensaje || 'No se pudo eliminar el inmueble.' });
    }
  };

  const filtrados = resultado.inmuebles.filter((i) => {
    const q = busqueda.toLowerCase();
    return !q || i.titulo?.toLowerCase().includes(q) || i.codigo?.toLowerCase().includes(q) || i.ubicacion?.ciudad?.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Topbar */}
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Gestión de inmuebles
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            {resultado.inmuebles.length} inmueble(s) registrados
          </p>
        </div>
        <Link to="/administrador/inmuebles/nuevo" className="btn-panel-primary" style={{ textDecoration: 'none', gap: 6 }}>
          <Plus className="h-4 w-4" /> Nuevo inmueble
        </Link>
      </div>

      {mensaje && (
        <div className={`alert ${mensaje.tipo}`} style={{ marginBottom: '1rem' }}>
          {mensaje.texto}
        </div>
      )}

      {/* Tabla */}
      <div className="table-responsive">
        <div className="tbl-toolbar" style={{ padding: '0.75rem 1rem' }}>
          <div className="tbl-search">
            <Search style={{ width: 15, height: 15 }} />
            <input
              type="text"
              placeholder="Buscar por título, código o ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="tbl-tools">
            <span style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)' }}>
              {filtrados.length} resultado(s)
            </span>
          </div>
        </div>

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando inmuebles...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título / Ubicación</th>
                <th>Tipo</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(15,23,42,0.4)' }}>No hay inmuebles que mostrar.</td></tr>
              ) : (
                filtrados.map((inmueble) => (
                  <tr key={inmueble._id}>
                    <td className="td-nowrap td-id">{inmueble.codigo}</td>
                    <td>
                      <span className="td-title">{inmueble.titulo}</span>
                      <span className="td-subtitle">{inmueble.ubicacion?.ciudad}</span>
                    </td>
                    <td className="td-nowrap" style={{ textTransform: 'capitalize' }}>{inmueble.tipo}</td>
                    <td className="td-nowrap" style={{ textTransform: 'capitalize' }}>{inmueble.modalidad}</td>
                    <td>
                      <span className={ESTADO_CLASE[inmueble.estado] ?? 'badge'}>
                        {inmueble.estado}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/inmuebles/${inmueble._id}`} className="btn-icon btn-icon--info" title="Ver" style={{ textDecoration: 'none' }}>
                          <Search className="h-3.5 w-3.5" />
                        </Link>
                        <Link to={`/administrador/inmuebles/${inmueble._id}/editar`} className="btn-icon btn-icon--edit" title="Editar" style={{ textDecoration: 'none' }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button type="button" className="btn-icon btn-icon--danger" title="Eliminar" onClick={() => eliminar(inmueble._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
