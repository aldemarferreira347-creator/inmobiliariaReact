import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Plus } from 'lucide-react';
import * as contratosServicio from '../../servicios/contratos.servicio';
import { claseEstadoContrato } from '../../utilidades/colorEstado';

function fmt(v) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v); }

export default function ContratosAdmin() {
  const [contratos, setContratos] = useState([]);
  const [reservasDisponibles, setReservasDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const cargar = async () => {
    setCargando(true);
    const [contratosData, reservasData] = await Promise.all([
      contratosServicio.listar(),
      contratosServicio.reservasDisponibles(),
    ]);
    setContratos(contratosData.contratos);
    setReservasDisponibles(reservasData.reservas);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const crear = async (datos) => {
    setError('');
    try {
      await contratosServicio.crear({ reservaId: datos.reservaId, fechaInicio: datos.fechaInicio, fechaFin: datos.fechaFin || null, valorMensual: Number(datos.valorMensual) });
      reset(); setMostrarForm(false); await cargar();
      setMensaje('Contrato emitido correctamente.');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo crear el contrato.');
    }
  };

  const subirArchivo = async (id, archivo) => {
    if (!archivo) return;
    await contratosServicio.subirArchivo(id, archivo);
    await cargar();
  };

  const rescindir = async (id) => {
    if (!window.confirm('¿Rescindir este contrato?')) return;
    await contratosServicio.rescindir(id);
    await cargar();
  };

  const marcarVencidos = async () => {
    const r = await contratosServicio.marcarVencidosManual();
    setMensaje(`Se marcaron ${r.totalVencidos} contrato(s) como vencido(s).`);
    await cargar();
  };

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Contratos de arriendo
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn-panel-warning" onClick={marcarVencidos}>Marcar vencidos</button>
          <button type="button" className="btn-panel-primary" onClick={() => setMostrarForm(!mostrarForm)}>
            <Plus className="h-4 w-4" /> {mostrarForm ? 'Cancelar' : 'Nuevo contrato'}
          </button>
        </div>
      </div>

      {mensaje && <div className="alert success" style={{ marginBottom: '1rem' }}>{mensaje}</div>}
      {error   && <div className="alert error"   style={{ marginBottom: '1rem' }}>{error}</div>}

      {mostrarForm && (
        <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Emitir contrato desde una reserva confirmada</h2>
          <form onSubmit={handleSubmit(crear)} className="form-grid">
            <div className="form-group form-group form-group" style={{ gridColumn: '1/-1' }}>
              <label htmlFor="reservaId">Reserva confirmada</label>
              <select id="reservaId" {...register('reservaId', { required: true })}>
                <option value="">Elige una reserva confirmada sin contrato</option>
                {reservasDisponibles.map((r) => (
                  <option key={r._id} value={r._id}>{r.codigo} — {r.inmueble?.titulo} ({r.cliente?.nombre} {r.cliente?.apellido})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="fechaInicio">Fecha de inicio</label>
              <input id="fechaInicio" type="date" {...register('fechaInicio', { required: true })} />
            </div>
            <div className="form-group">
              <label htmlFor="fechaFin">Fecha de fin <span className="text-opcional">(vacío = indefinido)</span></label>
              <input id="fechaFin" type="date" {...register('fechaFin')} />
            </div>
            <div className="form-group">
              <label htmlFor="valorMensual">Valor mensual</label>
              <input id="valorMensual" type="number" step="0.01" {...register('valorMensual', { required: true })} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-panel-primary">Emitir contrato</button>
            </div>
          </form>
        </div>
      )}

      {/* Listado */}
      {cargando ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando contratos...</p>
      ) : contratos.length === 0 ? (
        <div className="panel-card">
          <p style={{ textAlign: 'center', color: 'rgba(15,23,42,0.5)', padding: '1.5rem' }}>No hay contratos registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {contratos.map((c) => (
            <div key={c._id} className="panel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span className={`badge ${claseEstadoContrato(c.estado)}`}>{c.estado}</span>
                  <strong style={{ display: 'block', marginTop: '0.5rem', fontSize: '1rem' }}>{c.numeroContrato}</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{c.inmueble?.titulo} ({c.inmueble?.codigo})</p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: 'rgba(15,23,42,0.55)' }}>
                    Cliente: {c.reserva?.cliente?.nombre} {c.reserva?.cliente?.apellido}
                  </p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: 'rgba(15,23,42,0.55)' }}>
                    {new Date(c.fechaInicio).toLocaleDateString('es-CO')} → {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-CO') : 'Indefinido'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-gold-600)', fontFamily: 'var(--font-display)' }}>
                    {fmt(c.valorMensual)} / mes
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  {c.archivoPdfPath ? (
                    <a href={contratosServicio.urlDescarga(c._id)} target="_blank" rel="noreferrer" className="btn-panel-edit" style={{ textDecoration: 'none' }}>
                      Descargar PDF
                    </a>
                  ) : (
                    <label style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                      Subir PDF
                      <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => subirArchivo(c._id, e.target.files[0])} />
                    </label>
                  )}
                  {c.estado === 'Vigente' && (
                    <button type="button" className="btn-panel-danger" onClick={() => rescindir(c._id)}>
                      Rescindir
                    </button>
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
