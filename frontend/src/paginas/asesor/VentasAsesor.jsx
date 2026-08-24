import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DollarSign, Plus } from 'lucide-react';
import * as ventasServicio from '../../servicios/ventas.servicio';
import { claseEstadoVenta } from '../../utilidades/colorEstado';

function fmt(v) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v); }

export default function VentasAsesor() {
  const [ventas, setVentas] = useState([]);
  const [inmuebles, setInmuebles] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const cargar = async () => {
    setCargando(true);
    const [ventasData, inmueblesData, clientesData] = await Promise.all([
      ventasServicio.misVentas(),
      ventasServicio.inmueblesDisponibles(),
      ventasServicio.clientesActivos(),
    ]);
    setVentas(ventasData.ventas);
    setInmuebles(inmueblesData.inmuebles);
    setClientes(clientesData.clientes);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const registrar = async (datos) => {
    setError('');
    try {
      await ventasServicio.registrar({ inmuebleId: datos.inmuebleId, clienteId: datos.clienteId, precioVenta: Number(datos.precioVenta), fechaVenta: datos.fechaVenta, notaria: datos.notaria });
      reset(); setMostrarForm(false); await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo registrar la venta.');
    }
  };

  const subirEscritura = async (id, archivo) => {
    if (!archivo) return;
    setError('');
    try {
      await ventasServicio.subirEscritura(id, archivo);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo subir la escritura.');
    }
  };

  const cambiarEstado = async (id, estado) => {
    setError('');
    try {
      await ventasServicio.cambiarEstado(id, estado);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo cambiar el estado de la venta.');
    }
  };

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Mis ventas
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            {ventas.length} venta(s) registrada(s)
          </p>
        </div>
        <button type="button" className="btn-panel-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          <Plus className="h-4 w-4" /> {mostrarForm ? 'Cancelar' : 'Nueva venta'}
        </button>
      </div>

      {error && <div className="alert error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {mostrarForm && (
        <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Registrar nueva venta</h2>
          <form onSubmit={handleSubmit(registrar)} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label htmlFor="inmuebleId">Inmueble</label>
              <select id="inmuebleId" {...register('inmuebleId', { required: true })}>
                <option value="">Elige un inmueble disponible en venta</option>
                {inmuebles.map((i) => <option key={i._id} value={i._id}>{i.titulo} ({i.codigo})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label htmlFor="clienteId">Cliente comprador</label>
              <select id="clienteId" {...register('clienteId', { required: true })}>
                <option value="">Elige el cliente comprador</option>
                {clientes.map((c) => <option key={c._id} value={c._id}>{c.nombre} {c.apellido} ({c.correo})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="precioVenta">Precio de venta</label>
              <input id="precioVenta" type="number" step="0.01" {...register('precioVenta', { required: true })} />
            </div>
            <div className="form-group">
              <label htmlFor="fechaVenta">Fecha de venta</label>
              <input id="fechaVenta" type="date" {...register('fechaVenta', { required: true })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label htmlFor="notaria">Notaría <span className="text-opcional">(opcional)</span></label>
              <input id="notaria" type="text" {...register('notaria')} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" className="btn-panel-primary">Registrar venta</button>
            </div>
          </form>
        </div>
      )}

      {/* Historial */}
      {cargando ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando ventas...</p>
      ) : ventas.length === 0 ? (
        <div className="panel-card">
          <p style={{ textAlign: 'center', color: 'rgba(15,23,42,0.5)', padding: '1.5rem' }}>No tienes ventas registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ventas.map((v) => (
            <div key={v._id} className="panel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span className={`badge ${claseEstadoVenta(v.estado)}`}>{v.estado}</span>
                  <strong style={{ display: 'block', marginTop: '0.5rem' }}>{v.inmueble?.titulo} ({v.inmueble?.codigo})</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'rgba(15,23,42,0.55)' }}>
                    Cliente: {v.cliente?.nombre} {v.cliente?.apellido}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 700, color: 'var(--color-gold-600)', fontFamily: 'var(--font-display)' }}>
                    {fmt(v.precioVenta)} · {new Date(v.fechaVenta).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  {v.escrituraPdfPath ? (
                    <a href={ventasServicio.urlDescargaEscritura(v._id)} target="_blank" rel="noreferrer" className="btn-panel-edit" style={{ textDecoration: 'none' }}>
                      Descargar escritura
                    </a>
                  ) : (
                    <label style={{ fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-navy-700)' }}>
                      Subir escritura PDF
                      <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => subirEscritura(v._id, e.target.files[0])} />
                    </label>
                  )}
                  {v.estado === 'En proceso' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn-panel-primary" onClick={() => cambiarEstado(v._id, 'Finalizada')}>Finalizar</button>
                      <button type="button" className="btn-panel-danger"  onClick={() => cambiarEstado(v._id, 'Cancelada')}>Cancelar</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
