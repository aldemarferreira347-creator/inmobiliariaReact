import { useEffect, useState } from 'react';
import { Home, FileText, Download } from 'lucide-react';
import * as contratosServicio from '../../servicios/contratos.servicio';

export default function MisArriendos() {
  const [arriendos, setArriendos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    contratosServicio.misArriendos().then((data) => {
      setArriendos(data.arriendos ?? []);
      setCargando(false);
    });
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="panel-card" style={{ maxWidth: 900, margin: '0 auto' }}>
        
        <div className="panel-card-header panel-card-header--between">
          <h2><Home className="h-5 w-5" /> Mis arriendos</h2>
          {!cargando && <span className="badge" style={{ backgroundColor: 'var(--color-navy-500)' }}>{arriendos.length}</span>}
        </div>

        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando arriendos...</p>
        ) : arriendos.length === 0 ? (
          <div className="empty-state" style={{ margin: '1rem 0' }}>
            <div className="empty-state-icon"><Home className="h-8 w-8" /></div>
            <p className="empty-state-title">No tienes arriendos activos</p>
            <p className="empty-state-sub">Las propiedades que arriendes aparecerán aquí.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {arriendos.map(({ reserva, contrato, estadoVisible }) => (
              <div key={reserva._id} className="panel-card" style={{ border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  
                  <div>
                    <span className={`badge ${estadoVisible === 'Contrato Vigente' ? 'accent-green' : 'accent-orange'}`}>
                      {estadoVisible}
                    </span>
                    <strong style={{ display: 'block', fontSize: '1.125rem', marginTop: '0.5rem' }}>
                      {reserva.inmueble?.titulo} ({reserva.inmueble?.codigo})
                    </strong>
                    
                    {contrato ? (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                        <p style={{ margin: '0 0 0.25rem' }}><strong>Contrato:</strong> {contrato.numeroContrato}</p>
                        <p style={{ margin: 0, color: 'rgba(15,23,42,0.6)' }}>
                          <strong>Vigencia:</strong> {new Date(contrato.fechaInicio).toLocaleDateString('es-CO')} - {contrato.fechaFin ? new Date(contrato.fechaFin).toLocaleDateString('es-CO') : 'Indefinido'}
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: 'rgba(15,23,42,0.6)', marginTop: '0.5rem' }}>
                        Contrato en proceso de emisión.
                      </p>
                    )}
                  </div>
                  
                  {contrato?.archivoPdfPath && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <a href={contratosServicio.urlDescarga(contrato._id)} target="_blank" rel="noreferrer" className="btn-panel-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Download className="h-4 w-4" /> Descargar contrato
                      </a>
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
