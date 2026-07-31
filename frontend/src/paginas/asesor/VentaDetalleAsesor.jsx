import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, FileText, CheckCircle, XCircle, Upload, Paperclip } from 'lucide-react';
import * as ventasServicio from '../../servicios/ventas.servicio';
import { claseEstadoVenta } from '../../utilidades/colorEstado';

function fmt(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
}

export default function VentaDetalleAsesor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [subiendoPDF, setSubiendoPDF] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await ventasServicio.detalle(id);
      setVenta(data.venta ?? data);
    } catch {
      setVenta(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [id]); // eslint-disable-line

  const subirEscritura = async () => {
    if (!archivo) return;
    setSubiendoPDF(true);
    setError('');
    try {
      await ventasServicio.subirEscritura(id, archivo);
      setArchivo(null);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo subir el archivo.');
    } finally {
      setSubiendoPDF(false);
    }
  };

  const cambiarEstado = async (nuevoEstado) => {
    const confirmar = window.confirm(`¿${nuevoEstado === 'Finalizada' ? 'Finalizar' : 'Cancelar'} esta venta?`);
    if (!confirmar) return;
    setCambiandoEstado(true);
    setError('');
    try {
      await ventasServicio.cambiarEstado(id, nuevoEstado);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo actualizar el estado.');
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (cargando) return <p style={{ padding: '3rem', textAlign: 'center' }}>Cargando detalle de la venta...</p>;
  if (!venta)   return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <p>Venta no encontrada.</p>
      <Link to="/asesor/ventas" className="btn-panel-primary" style={{ textDecoration: 'none', marginTop: '1rem', display: 'inline-flex', gap: 6 }}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
    </div>
  );

  return (
    <div>
      {/* Topbar */}
      <div className="panel-topbar">
        <div>
          <button type="button" onClick={() => navigate('/asesor/ventas')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', padding: 0 }}>
            <ArrowLeft className="h-4 w-4" /> Volver a mis ventas
          </button>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Detalle de venta
          </h1>
        </div>
        <span className={`badge ${claseEstadoVenta(venta.estado)}`} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          {venta.estado}
        </span>
      </div>

      {error && <div className="alert error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* Datos de la venta */}
      <div className="panel-card" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-card-header">
          <h2><DollarSign className="h-5 w-5" /> Datos de la venta</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          {[
            { label: 'Inmueble',    value: `${venta.inmueble?.titulo ?? '—'} (${venta.inmueble?.codigo ?? ''})` },
            { label: 'Cliente',     value: `${venta.cliente?.nombre ?? ''} ${venta.cliente?.apellido ?? ''}` },
            { label: 'Precio',      value: fmt(venta.precioVenta), highlight: true },
            { label: 'Fecha venta', value: venta.fechaVenta ? new Date(venta.fechaVenta).toLocaleDateString('es-CO') : '—' },
            { label: 'Notaría',     value: venta.notaria ?? '—' },
          ].map(({ label, value, highlight }) => (
            <div key={label}>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <p style={{ margin: '0.2rem 0 0', fontWeight: highlight ? 700 : 500, fontSize: '0.9375rem', color: highlight ? 'var(--color-gold-600, #d97706)' : '#1e293b' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Escritura pública */}
      <div className="panel-card" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-card-header">
          <h2><FileText className="h-5 w-5" /> Escritura pública</h2>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          {venta.escrituraPdfPath ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600 }}>
                <CheckCircle className="h-5 w-5" /> Documento cargado
              </span>
              <a href={ventasServicio.urlDescargaEscritura(id)} target="_blank" rel="noreferrer" className="btn-panel-edit" style={{ textDecoration: 'none' }}>
                Descargar escritura PDF
              </a>
            </div>
          ) : (
            <p style={{ color: 'rgba(15,23,42,0.55)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Aún no se ha subido la escritura.
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.5rem 0.875rem', cursor: 'pointer', fontSize: '0.875rem', color: '#334155', background: '#f8fafc' }}>
              <Paperclip className="h-4 w-4" />
              {archivo ? archivo.name : 'Seleccionar PDF'}
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => setArchivo(e.target.files[0])} />
            </label>
            {archivo && (
              <button type="button" className="btn-panel-primary" style={{ display: 'flex', gap: 6 }} onClick={subirEscritura} disabled={subiendoPDF}>
                <Upload className="h-4 w-4" />
                {subiendoPDF ? 'Subiendo...' : 'Subir PDF'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Acciones de estado */}
      {venta.estado === 'En proceso' && (
        <div className="panel-card">
          <div className="panel-card-header">
            <h2>Actualizar estado</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-panel-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => cambiarEstado('Finalizada')}
              disabled={cambiandoEstado}
            >
              <CheckCircle className="h-4 w-4" /> Marcar como finalizada
            </button>
            <button
              type="button"
              className="btn-panel-danger"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => cambiarEstado('Cancelada')}
              disabled={cambiandoEstado}
            >
              <XCircle className="h-4 w-4" /> Cancelar venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
