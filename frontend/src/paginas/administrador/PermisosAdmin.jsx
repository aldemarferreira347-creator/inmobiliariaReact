import { useEffect, useState } from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import api from '../../servicios/api';

const ROL_CLASE = { 
  administrador: 'badge-rol-admin', 
  asesor: 'badge-rol-asesor', 
  cliente: 'badge-rol-cliente' 
};

export default function PermisosAdmin() {
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get('/permisos')
      .then(({ data }) => setPermisos(data.permisos ?? []))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Matriz de permisos
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            Vista informativa de los accesos permitidos según el rol del usuario.
          </p>
        </div>
      </div>

      <div className="panel-card">
        {cargando ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando matriz de permisos...</p>
        ) : (
          <div className="table-responsive">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th>Acción permitida</th>
                  <th>Roles con acceso</th>
                </tr>
              </thead>
              <tbody>
                {permisos.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(15,23,42,0.4)' }}>
                      No se encontró información de permisos.
                    </td>
                  </tr>
                ) : (
                  permisos.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShieldCheck className="h-4 w-4" style={{ color: 'rgba(15,23,42,0.3)' }} />
                          <span style={{ textTransform: 'capitalize' }}>{p.modulo}</span>
                        </div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{p.accion}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {p.rolesAsociados.map((rol) => (
                            <span key={rol} className={`badge ${ROL_CLASE[rol] ?? ''}`}>
                              {rol}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
