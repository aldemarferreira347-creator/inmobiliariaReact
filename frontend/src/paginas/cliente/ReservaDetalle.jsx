import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClipboardList, AlertCircle, Clock, CreditCard, XCircle, CheckCircle } from 'lucide-react';
import * as reservasServicio from '../../servicios/reservas.servicio';
import * as tarjetasServicio from '../../servicios/tarjetas.servicio';
import { obtenerStripe } from '../../utilidades/stripeCliente';
import { claseEstadoReserva } from '../../utilidades/colorEstado';

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

export default function ReservaDetalle() {
  const { id } = useParams();
  const [datos, setDatos] = useState(null);
  const [tarjetas, setTarjetas] = useState([]);
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [detalleData, tarjetasData] = await Promise.all([
      reservasServicio.detalle(id),
      tarjetasServicio.listar().catch(() => ({ tarjetas: [] })),
    ]);
    setDatos(detalleData);
    setTarjetas(tarjetasData.tarjetas);
    setCargando(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const admitePago = datos && ['PENDIENTE_PAGO', 'RECHAZADA'].includes(datos.reserva.estado);

  const pagarConCheckout = async () => {
    setError('');
    setProcesando(true);
    try {
      const resultado = await reservasServicio.pagar(id);
      window.location.href = resultado.url;
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar el pago');
      setProcesando(false);
    }
  };

  const pagarConTarjetaGuardada = async () => {
    if (!tarjetaSeleccionada) return;
    setError('');
    setProcesando(true);
    try {
      const resultado = await reservasServicio.pagar(id, tarjetaSeleccionada);
      if (resultado.estado === 'requires_action') {
        const stripe = await obtenerStripe();
        const { error: errorConfirmacion } = await stripe.confirmCardPayment(resultado.clientSecret);
        if (errorConfirmacion) {
          setError(errorConfirmacion.message);
          setProcesando(false);
          return;
        }
      }
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'El pago no pudo procesarse');
    } finally {
      setProcesando(false);
    }
  };

  const cancelar = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    await reservasServicio.cancelarPropia(id);
    await cargar();
  };

  if (cargando) return <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando reserva...</p>;
  if (!datos) return <p style={{ padding: '2rem', textAlign: 'center' }}>Reserva no encontrada</p>;

  const { reserva, pagos, historial } = datos;

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="rdetalle-grid">
        
        {/* -- Columna Izquierda: Información Principal -- */}
        <div className="rdetalle-main">
          
          <div className="rdetalle-header">
            <div className="rdetalle-header-top">
              <span className={`badge ${claseEstadoReserva(reserva.estado)}`}>{reserva.estado}</span>
              <span className="rdetalle-codigo">Código: {reserva.codigo}</span>
            </div>
            
            <h1>{reserva.inmueble?.titulo}</h1>
            <p className="rdetalle-meta">
              <Clock className="h-4 w-4" /> 
              Vence: {new Date(reserva.fechaExpiracion).toLocaleString('es-CO')}
            </p>
          </div>

          {error && (
            <div className="auth-alert error" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {admitePago && (
            <div className="rdetalle-pago-box panel-card">
              <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard className="h-5 w-5" /> Completar pago de reserva
              </h2>
              
              <button type="button" className="btn-panel-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={procesando} onClick={pagarConCheckout}>
                Pagar con Stripe Checkout
              </button>

              {tarjetas.length > 0 && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>O usa una tarjeta guardada:</p>
                  <select 
                    value={tarjetaSeleccionada} 
                    onChange={(e) => setTarjetaSeleccionada(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(0,0,0,0.2)' }}
                  >
                    <option value="">Selecciona una tarjeta</option>
                    {tarjetas.map((t) => (
                      <option key={t._id} value={t._id}>{t.marca} **** {t.ultimos4} ({t.mesExpiracion}/{t.anioExpiracion})</option>
                    ))}
                  </select>
                  <button type="button" className="btn-panel-primary" style={{ width: '100%' }} disabled={procesando || !tarjetaSeleccionada} onClick={pagarConTarjetaGuardada}>
                    Pagar con esta tarjeta
                  </button>
                </div>
              )}
              
              <p style={{ marginTop: '1rem', fontSize: '0.8125rem', textAlign: 'center' }}>
                <Link to="/tarjetas">Gestionar mis tarjetas</Link>
              </p>
            </div>
          )}

          {reserva.estado === 'PENDIENTE_PAGO' && (
            <button type="button" className="btn-panel-danger" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: 6 }} onClick={cancelar}>
              <XCircle className="h-4 w-4" /> Cancelar reserva
            </button>
          )}

        </div>

        {/* -- Columna Derecha: Sidebar con Detalles -- */}
        <aside className="rdetalle-sidebar">
          
          <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>Resumen</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'rgba(15,23,42,0.65)', fontSize: '0.875rem' }}>Valor reserva:</span>
              <strong style={{ fontSize: '1.125rem', color: 'var(--color-gold-600)' }}>{formatoMoneda(reserva.monto)}</strong>
            </div>
            {reserva.fechaConfirmacion && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(15,23,42,0.65)', fontSize: '0.875rem' }}>Confirmada el:</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{new Date(reserva.fechaConfirmacion).toLocaleDateString('es-CO')}</span>
              </div>
            )}
          </div>

          <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>Historial</h3>
            <div className="historial-lista">
              {historial.map((h) => (
                <div key={h._id} className="historial-item">
                  <div className="historial-dot" />
                  <div className="historial-content">
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{h.estadoAnterior} → {h.estadoNuevo}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(15,23,42,0.55)' }}>
                      {new Date(h.fecha).toLocaleString('es-CO')}
                      {h.motivo ? ` - ${h.motivo}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pagos.length > 0 && (
            <div className="panel-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>Pagos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pagos.map((p) => (
                  <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.estado === 'succeeded' ? <CheckCircle className="h-4 w-4" style={{ color: '#059669' }}/> : <XCircle className="h-4 w-4" style={{ color: '#dc2626' }}/>}
                      <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{p.estado}</span>
                    </div>
                    <strong style={{ fontSize: '0.875rem' }}>{formatoMoneda(p.monto)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>

      </div>
    </div>
  );
}
