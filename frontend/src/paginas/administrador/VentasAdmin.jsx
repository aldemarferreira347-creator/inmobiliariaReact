import { useEffect, useState } from 'react';
import { DollarSign, Search, CheckCircle, XCircle } from 'lucide-react';
import * as ventasServicio from '../../servicios/ventas.servicio';
import { claseEstadoVenta } from '../../utilidades/colorEstado';
import { useToast } from '../../contexto/ToastContext';

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

export default function VentasAdmin() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const toast = useToast();

  const cargar = async () => {
    setCargando(true);
    const data = await ventasServicio.listarTodas();
    setVentas(data.ventas ?? []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (id, estado) => {
    if (!window.confirm(`¿${estado === 'Finalizada' ? 'Finalizar' : 'Cancelar'} esta venta?`)) return;
    try {
      await ventasServicio.cambiarEstado(id, estado);
      await cargar();
      toast.exito(`Venta ${estado === 'Finalizada' ? 'finalizada' : 'cancelada'} correctamente.`);
    } catch (e) {
      toast.error(e.response?.data?.mensaje || 'No se pudo actualizar el estado.');
    }
  };

  const filtradas = ventas.filter((v) => {
    const q = busqueda.toLowerCase();
    return !q
      || v.inmueble?.titulo?.toLowerCase().includes(q)
      || v.inmueble?.codigo?.toLowerCase().includes(q)
      || `${v.cliente?.nombre} ${v.cliente?.apellido}`.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Topbar */}
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Gestión de ventas
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            {ventas.length} venta(s) registrada(s)
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-responsive">
        <div className="tbl-toolbar" style={{ padding: '0.75rem 1rem' }}>
          <div className="tbl-search">
            <Search style={{ width: 15, height: 15 }} />
            <input
              type="text"
              placeholder="Buscar por inmueble o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="tbl-tools">
            <span style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)' }}>
              {filtradas.length} resultado(s)
            </span>
          </div>
        </div>

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando ventas...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Inmueble</th>
                <th>Cliente</th>
                <th>Asesor</th>
                <th>Precio</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(15,23,42,0.4)' }}>
                    No hay ventas que mostrar.
                  </td>
                </tr>
              ) : (
                filtradas.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <span className="td-title">{v.inmueble?.titulo}</span>
                      <span className="td-subtitle">{v.inmueble?.codigo}</span>
                    </td>
                    <td>
                      <span className="td-title">{v.cliente?.nombre} {v.cliente?.apellido}</span>
                      <span className="td-subtitle">{v.cliente?.correo}</span>
                    </td>
                    <td className="td-subtitle">
                      {v.asesor ? `${v.asesor.nombre} ${v.asesor.apellido}` : '—'}
                    </td>
                    <td className="td-price">{formatoMoneda(v.precioVenta)}</td>
                    <td className="td-date td-nowrap">
                      {v.fechaVenta ? new Date(v.fechaVenta).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${claseEstadoVenta(v.estado)}`}>{v.estado}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {v.escrituraPdfPath && (
                          <a
                            href={ventasServicio.urlDescargaEscritura(v._id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-icon btn-icon--info"
                            title="Descargar escritura"
                          >
                            ↓
                          </a>
                        )}
                        {v.estado === 'En proceso' && (
                          <>
                            <button
                              type="button"
                              className="btn-icon btn-icon--success"
                              title="Finalizar venta"
                              onClick={() => cambiarEstado(v._id, 'Finalizada')}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-icon--danger"
                              title="Cancelar venta"
                              onClick={() => cambiarEstado(v._id, 'Cancelada')}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
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
