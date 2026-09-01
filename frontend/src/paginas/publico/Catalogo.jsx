import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import * as inmueblesServicio from '../../servicios/inmuebles.servicio';
import TarjetaInmueble from '../../componentes/inmuebles/TarjetaInmueble';
import FiltrosCatalogo from '../../componentes/inmuebles/FiltrosCatalogo';

export default function Catalogo() {
  const [resultado, setResultado] = useState({ inmuebles: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({});
  const [hayFiltros, setHayFiltros] = useState(false);

  useEffect(() => {
    setCargando(true);
    inmueblesServicio
      .listar(filtros)
      .then(setResultado)
      .catch(() => setResultado({ inmuebles: [], total: 0 }))
      .finally(() => setCargando(false));
  }, [filtros]);

  const manejarFiltrar = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setHayFiltros(Object.values(nuevosFiltros).some(Boolean));
  };

  return (
    <>
      {/* ── Mini Hero ── */}
      <div className="page-hero">
        <span className="page-hero-badge">
          <Sparkles className="h-3.5 w-3.5" /> Catálogo completo
        </span>
        <h1>Todos los inmuebles</h1>
        <p>Encuentra la propiedad perfecta para tu vida o negocio en Neiva</p>
      </div>

      <section>
        <div className="container propiedades-container">
          <FiltrosCatalogo onFiltrar={manejarFiltrar} />

          {hayFiltros && !cargando && (
            <p className="resultado-filtro">
              <Search className="h-4 w-4" />
              Se encontraron <strong>{resultado.inmuebles.length}</strong> inmueble(s) con los filtros aplicados.
            </p>
          )}

          <div className="inmuebles-grid" id="listaInmuebles">
            {cargando ? (
              <p style={{ padding: '2rem 0', gridColumn: '1/-1', textAlign: 'center' }}>
                Cargando inmuebles...
              </p>
            ) : resultado.inmuebles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Search className="h-10 w-10" /></div>
                <p className="empty-state-title">
                  {hayFiltros
                    ? 'No se encontraron inmuebles con los criterios seleccionados'
                    : 'No hay inmuebles disponibles en este momento'}
                </p>
                {hayFiltros && (
                  <p className="empty-state-sub">Intenta con otros filtros de búsqueda.</p>
                )}
              </div>
            ) : (
              resultado.inmuebles.map((inmueble) => (
                <TarjetaInmueble key={inmueble._id} inmueble={inmueble} />
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
