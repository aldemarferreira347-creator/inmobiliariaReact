import { useEffect, useState } from 'react';
import { BarChart2, Download } from 'lucide-react';
import * as reportesServicio from '../../servicios/reportes.servicio';

function fmt(v) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0); }
function fmtFecha(f) { return f ? new Date(f).toLocaleDateString('es-CO') : '—'; }

const PERIODOS = [
  { valor: 'semana', texto: 'Última semana' },
  { valor: 'mes',    texto: 'Último mes' },
  { valor: 'anio',   texto: 'Último año' },
];

export default function ReportesAdmin() {
  const [filtros, setFiltros] = useState({ periodo: 'mes', tipo: '', estado: '', ciudad: '', fechaInicio: '', fechaFin: '' });
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    const data = await reportesServicio.obtenerDatos(filtros);
    setResumen(data.resumen);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []); // eslint-disable-line

  const cambiar = (campo, v) => setFiltros((p) => ({ ...p, [campo]: v }));

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Reportes
          </h1>
        </div>
        <div className="export-buttons">
          <a href={reportesServicio.urlExportarExcel(filtros)} className="btn-export" target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" /> Excel
          </a>
          <a href={reportesServicio.urlExportarPdf(filtros)} className="btn-export" target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" /> PDF
          </a>
        </div>
      </div>

      {/* Tabs de periodo */}
      <div className="periodo-tabs">
        {PERIODOS.map((p) => (
          <button
            key={p.valor}
            type="button"
            className={`periodo-tab${filtros.periodo === p.valor ? ' active' : ''}`}
            onClick={() => cambiar('periodo', p.valor)}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {/* Filtros adicionales */}
      <div className="reporte-filters" style={{ marginBottom: '1.5rem' }}>
        <label>Ciudad <input value={filtros.ciudad} onChange={(e) => cambiar('ciudad', e.target.value)} placeholder="Todas" /></label>
        <label>Desde <input type="date" value={filtros.fechaInicio} onChange={(e) => cambiar('fechaInicio', e.target.value)} /></label>
        <label>Hasta  <input type="date" value={filtros.fechaFin}    onChange={(e) => cambiar('fechaFin', e.target.value)} /></label>
        <button type="button" className="btn-panel-primary" onClick={cargar}>Aplicar filtros</button>
      </div>

      {cargando || !resumen ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando reportes...</p>
      ) : (
        <>
          {/* Stat cards */}
          <div className="stat-cards" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Total inmuebles',       valor: resumen.inmuebles?.total        ?? 0, color: 'var(--color-navy-600)' },
              { label: 'Disponibles',           valor: resumen.inmuebles?.disponibles  ?? 0, color: '#059669' },
              { label: 'Total reservas',        valor: resumen.reservas?.total         ?? 0, color: '#f5a623' },
              { label: 'Reservas confirmadas',  valor: resumen.reservas?.confirmadas   ?? 0, color: '#7c3aed' },
              { label: 'Clientes',              valor: resumen.clientes?.total         ?? 0, color: 'var(--color-navy-500)' },
              { label: 'Nuevos clientes',       valor: resumen.clientes?.nuevosEnPeriodo ?? 0, color: '#059669' },
              { label: 'Total recaudado',       valor: fmt(resumen.financiero?.totalRecaudado), color: 'var(--color-gold-600)', esMonto: true },
              { label: 'Pagos rechazados',      valor: resumen.financiero?.pagosRechazados ?? 0, color: '#dc2626' },
            ].map(({ label, valor, color }) => (
              <div key={label} className="stat-card">
                <span className="stat-value" style={{ color, fontSize: typeof valor === 'string' ? '1rem' : undefined }}>{valor}</span>
                <span className="stat-sub">{label}</span>
              </div>
            ))}
          </div>

          {/* Tabla de reservas */}
          {(resumen.reservas?.listado?.length ?? 0) > 0 && (
            <>
              <p className="reporte-section-title"><BarChart2 className="h-5 w-5" /> Detalle de reservas ({resumen.reservas.listado.length})</p>
              <div className="reporte-table-wrap">
                <table className="reporte-table">
                  <thead><tr><th>Código</th><th>Fecha</th><th>Inmueble</th><th>Cliente</th><th>Monto</th><th>Estado</th></tr></thead>
                  <tbody>
                    {resumen.reservas.listado.map((r) => (
                      <tr key={r.codigo}>
                        <td className="td-id">{r.codigo}</td>
                        <td className="td-date">{fmtFecha(r.fecha)}</td>
                        <td>{r.inmueble}</td>
                        <td>{r.cliente}</td>
                        <td className="td-price">{fmt(r.monto)}</td>
                        <td><span className="badge">{r.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tabla contratos */}
          {(resumen.listadoContratosVigentes?.length ?? 0) > 0 && (
            <>
              <p className="reporte-section-title"><BarChart2 className="h-5 w-5" /> Contratos vigentes ({resumen.listadoContratosVigentes.length})</p>
              <div className="reporte-table-wrap">
                <table className="reporte-table">
                  <thead><tr><th>Número</th><th>Inmueble</th><th>Cliente</th><th>Valor mensual</th><th>Fecha fin</th></tr></thead>
                  <tbody>
                    {resumen.listadoContratosVigentes.map((c) => (
                      <tr key={c.numeroContrato}>
                        <td className="td-id">{c.numeroContrato}</td>
                        <td>{c.inmueble}</td>
                        <td>{c.cliente}</td>
                        <td className="td-price">{fmt(c.valorMensual)}</td>
                        <td className="td-date">{c.fechaFin ? fmtFecha(c.fechaFin) : 'Indefinido'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tabla ventas */}
          {(resumen.listadoVentas?.length ?? 0) > 0 && (
            <>
              <p className="reporte-section-title"><BarChart2 className="h-5 w-5" /> Ventas ({resumen.listadoVentas.length})</p>
              <div className="reporte-table-wrap">
                <table className="reporte-table">
                  <thead><tr><th>Inmueble</th><th>Asesor</th><th>Precio</th><th>Fecha</th><th>Estado</th></tr></thead>
                  <tbody>
                    {resumen.listadoVentas.map((v, i) => (
                      <tr key={i}>
                        <td>{v.inmueble}</td>
                        <td>{v.asesor}</td>
                        <td className="td-price">{fmt(v.precioVenta)}</td>
                        <td className="td-date">{fmtFecha(v.fechaVenta)}</td>
                        <td><span className="badge">{v.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
