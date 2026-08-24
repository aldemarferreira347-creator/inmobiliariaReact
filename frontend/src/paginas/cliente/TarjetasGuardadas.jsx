import { useEffect, useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Trash2, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import { obtenerStripe } from '../../utilidades/stripeCliente';
import * as tarjetasServicio from '../../servicios/tarjetas.servicio';

function FormularioNuevaTarjeta({ onGuardada, onCancelar }) {
  const stripe = useStripe();
  const elements = useElements();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcesando(true);
    setError('');
    try {
      const { clientSecret } = await tarjetasServicio.crearSetupIntent();
      const { error: errorConfirmacion, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      
      if (errorConfirmacion) {
        setError(errorConfirmacion.message);
        return;
      }

      await tarjetasServicio.guardar(setupIntent.payment_method);
      elements.getElement(CardElement).clear();
      await onGuardada();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar la tarjeta');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <form onSubmit={enviar}>
      {error && (
        <div className="auth-alert error" style={{ marginBottom: '1rem' }}>
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label>Datos de la tarjeta</label>
        <div style={{ padding: '0.75rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.5rem', backgroundColor: 'white' }}>
          <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: '16px', color: '#0f172a', '::placeholder': { color: '#94a3b8' } } } }} />
        </div>
        <small style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.5rem', color: 'rgba(15,23,42,0.6)' }}>
          <ShieldCheck className="h-3.5 w-3.5 text-green" /> Pagos seguros procesados por Stripe
        </small>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn-panel-primary" disabled={!stripe || procesando}>
          {procesando ? 'Guardando...' : 'Guardar tarjeta'}
        </button>
      </div>
    </form>
  );
}

export default function TarjetasGuardadas() {
  const [tarjetas, setTarjetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    const data = await tarjetasServicio.listar();
    setTarjetas(data.tarjetas ?? []);
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta tarjeta guardada?')) return;
    setError('');
    try {
      await tarjetasServicio.eliminar(id);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo eliminar la tarjeta.');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="panel-card" style={{ maxWidth: 700, margin: '0 auto' }}>
        
        <div className="panel-card-header panel-card-header--between">
          <h2><CreditCard className="h-5 w-5" /> Mis tarjetas de pago</h2>
          <button 
            type="button" 
            className="btn-panel-primary" 
            onClick={() => setMostrarForm(!mostrarForm)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus className="h-4 w-4" /> {mostrarForm ? 'Cerrar form' : 'Agregar tarjeta'}
          </button>
        </div>

        {error && (
          <div className="auth-alert error" style={{ marginBottom: '1rem' }}>
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {mostrarForm && (
          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(15,23,42,0.02)', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Agregar nueva tarjeta</h3>
            <Elements stripe={obtenerStripe()}>
              <FormularioNuevaTarjeta onGuardada={() => { setMostrarForm(false); cargar(); }} onCancelar={() => setMostrarForm(false)} />
            </Elements>
          </div>
        )}

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando tarjetas...</p>
        ) : tarjetas.length === 0 ? (
          <div className="empty-state" style={{ margin: '1rem 0' }}>
            <div className="empty-state-icon"><CreditCard className="h-8 w-8" /></div>
            <p className="empty-state-title">No tienes tarjetas guardadas</p>
            <p className="empty-state-sub">Agrega una tarjeta para agilizar el pago de tus reservas.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {tarjetas.map((t) => (
              <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'rgba(15,23,42,0.05)', borderRadius: '0.375rem' }}>
                    <CreditCard className="h-5 w-5" style={{ color: 'var(--color-navy-600)' }} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', textTransform: 'capitalize' }}>
                      {t.marca} **** {t.ultimos4}
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: 'rgba(15,23,42,0.6)' }}>
                      Expira: {t.mesExpiracion.toString().padStart(2, '0')}/{t.anioExpiracion}
                    </span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-icon btn-icon--danger" 
                  onClick={() => eliminar(t._id)}
                  title="Eliminar tarjeta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
