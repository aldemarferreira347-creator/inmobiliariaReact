import { useEffect, useState } from 'react';
import { Key, Download } from 'lucide-react';
import * as ventasServicio from '../../servicios/ventas.servicio';
import { claseEstadoVenta } from '../../utilidades/colorEstado';

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

export default function MisCompras() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    ventasServicio.misCompras().then((data) => {
      setVentas(data.ventas ?? []);
      setCargando(false);
    });
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="panel-card" style={{ maxWidth: 900, margin: '0 auto' }}>
        
        <div className="panel-card-header panel-card-header--between">
          <h2><Key className="h-5 w-5" /> Mis compras</h2>
          {!cargando && <span className="badge" style={{ backgroundColor: 'var(--color-navy-500)' }}>{ventas.length}</span>}
        </div>

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando compras...</p>
        ) : ventas.length === 0 ? (
          <div className="empty-state" style={{ margin: '1rem 0' }}>
            <div className="empty-state-icon"><Key className="h-8 w-8" /></div>
            <p className="empty-state-title">No tienes compras registradas</p>
            <p className="empty-state-sub">Las propiedades que compres aparecerán en este historial.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {ventas.map((v) => (
              <div key={v._id} className="panel-card" style={{ border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  
                  <div>
                    <span className={`badge ${claseEstadoVenta(v.estado)}`}>
                      {v.estado}
                    </span>
                    <strong style={{ display: 'block', fontSize: '1.125rem', marginTop: '0.5rem' }}>
                      {v.inmueble?.titulo} ({v.inmueble?.codigo})
                    </strong>
                    
                    <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                      <p style={{ margin: '0 0 0.25rem', color: 'rgba(15,23,42,0.6)' }}>
                        <strong>Fecha:</strong> {new Date(v.fechaVenta).toLocaleDateString('es-CO')}
                      </p>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--color-gold-600)' }}>
                        {formatoMoneda(v.precioVenta)}
                      </p>
                    </div>
                  </div>
                  
                  {v.escrituraPdfPath ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <a href={ventasServicio.urlDescargaEscritura(v._id)} target="_blank" rel="noreferrer" className="btn-panel-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Download className="h-4 w-4" /> Descargar escritura
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(15,23,42,0.5)', margin: 0 }}>
                        Escritura en proceso
                      </p>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
