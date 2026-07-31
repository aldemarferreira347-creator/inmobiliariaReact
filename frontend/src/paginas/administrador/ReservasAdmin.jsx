import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, Search, XCircle, Play } from 'lucide-react';
import * as reservasServicio from '../../servicios/reservas.servicio';
import { claseEstadoReserva } from '../../utilidades/colorEstado';

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

export default function ReservasAdmin() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargar = async () => {
    setCargando(true);
    const data = await reservasServicio.listarTodas();
    setReservas(data.reservas ?? []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const cancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta reserva administrativamente?')) return;
    setMensaje(null);
    try {
      await reservasServicio.cancelarAdmin(id);
      await cargar();
      setMensaje({ tipo: 'success', texto: 'Reserva cancelada.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.response?.data?.mensaje || 'No se pudo cancelar.' });
    }
  };

  const expirarVencidas = async () => {
    setMensaje(null);
    const resultado = await reservasServicio.expirarVencidasManual();
    setMensaje({ tipo: 'success', texto: `Se expiraron ${resultado.totalExpiradas} reserva(s) vencida(s).` });
    await cargar();
  };

  const filtradas = reservas.filter((r) => {
    const q = busqueda.toLowerCase();
    const matchBusqueda = !q || r.codigo?.toLowerCase().includes(q) || r.inmueble?.titulo?.toLowerCase().includes(q) || r.cliente?.nombre?.toLowerCase().includes(q);
    const matchEstado = !filtroEstado || r.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const estados = [...new Set(reservas.map(r => r.estado))];

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Gestión de reservas
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            {reservas.length} reserva(s) en total
          </p>
        </div>
        <button type="button" className="btn-panel-warning" onClick={expirarVencidas} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Play className="h-4 w-4" /> Ejecutar expiración manual
        </button>
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
              placeholder="Buscar por código, inmueble o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="tbl-tools" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}>
              <option value="">Todos los estados</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)' }}>
              {filtradas.length} resultado(s)
            </span>
          </div>
        </div>

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando reservas...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Inmueble</th>
                <th>Cliente</th>
                <th>Vencimiento</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(15,23,42,0.4)' }}>No hay reservas que mostrar.</td></tr>
              ) : (
                filtradas.map((r) => (
                  <tr key={r._id}>
                    <td className="td-nowrap td-id">{r.codigo}</td>
                    <td>
                      <span className="td-title">{r.inmueble?.titulo}</span>
                      <span className="td-subtitle">{r.inmueble?.codigo}</span>
                    </td>
                    <td>
                      <span className="td-title">{r.cliente?.nombre} {r.cliente?.apellido}</span>
                      <span className="td-subtitle">{r.cliente?.correo}</span>
                    </td>
                    <td className="td-nowrap">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: new Date(r.fechaExpiracion) < new Date() && r.estado === 'PENDIENTE_PAGO' ? '#dc2626' : 'inherit' }}>
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(r.fechaExpiracion).toLocaleDateString('es-CO')}
                      </span>
                    </td>
                    <td className="td-price">{formatoMoneda(r.monto)}</td>
                    <td>
                      <span className={`badge ${claseEstadoReserva(r.estado)}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/administrador/reservas/${r._id}`} className="btn-icon btn-icon--info" title="Ver detalle" style={{ textDecoration: 'none' }}>
                          <Search className="h-3.5 w-3.5" />
                        </Link>
                        {!['CANCELADA', 'RECHAZADA', 'EXPIRADA'].includes(r.estado) && (
                          <button type="button" className="btn-icon btn-icon--danger" title="Cancelar reserva" onClick={() => cancelar(r._id)}>
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
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
