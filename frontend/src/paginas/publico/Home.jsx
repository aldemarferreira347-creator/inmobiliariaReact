import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Building2, UserPlus, Shield, Phone, ArrowRight, Search } from 'lucide-react';
import * as inmueblesServicio from '../../servicios/inmuebles.servicio';
import * as estadisticasServicio from '../../servicios/estadisticas.servicio';
import TarjetaInmueble from '../../componentes/inmuebles/TarjetaInmueble';

export default function Home() {
  const [destacados, setDestacados] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ codigo: '', modalidad: '', precio_max: '' });
  const navigate = useNavigate();

  useEffect(() => {
    inmueblesServicio.destacados()
      .then((data) => setDestacados(data.inmuebles ?? []))
      .catch(() => {})
      .finally(() => setCargando(false));

    estadisticasServicio.obtener()
      .then((data) => setEstadisticas(data.estadisticas ?? data))
      .catch(() => {});
  }, []);

  const buscar = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filtros.codigo)     params.set('codigo', filtros.codigo);
    if (filtros.modalidad)  params.set('modalidad', filtros.modalidad);
    if (filtros.precio_max) params.set('precio_max', filtros.precio_max);
    navigate(`/catalogo?${params.toString()}`);
  };

  return (
    <>
      {/* ══ HERO ══ */}
      <section className="hero-section">
        <div className="hero-particles" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="hero-content fade-up">
          <span className="hero-badge">
            <Sparkles className="h-4 w-4" /> Neiva, Huila — Colombia
          </span>
          <h1>
            Encuentra tu <span>hogar ideal</span><br />con García Inmobiliaria
          </h1>
          <p>
            Apartamentos, casas y locales en las mejores ubicaciones de Neiva.<br />
            Compra, venta y arriendo con asesoría personalizada.
          </p>
          <div className="hero-actions">
            <Link to="/catalogo" className="btn-hero">
              <Building2 className="h-5 w-5" /> Ver inmuebles
            </Link>
            <Link to="/registro" className="btn-hero-outline">
              <UserPlus className="h-5 w-5" /> Registrarme gratis
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ══ ESTADÍSTICAS ══ */}
        {estadisticas && (
          <div className="stats-strip fade-up fade-up-delay-1">
            <div className="stat-item">
              <span className="stat-number">+{estadisticas.inmuebles ?? 0}</span>
              <span className="stat-label">Inmuebles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">+{estadisticas.clientes ?? 0}</span>
              <span className="stat-label">Clientes felices</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">+{estadisticas.asesores ?? 0}</span>
              <span className="stat-label">Asesores activos</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">+{estadisticas.citas ?? 0}</span>
              <span className="stat-label">Visitas a inmuebles</span>
            </div>
          </div>
        )}

        {/* ══ FILTROS RÁPIDOS ══ */}
        <section className="filtros fade-up fade-up-delay-2">
          <h2><Search className="h-5 w-5" /> Buscar inmuebles</h2>
          <form className="filtro-inputs" onSubmit={buscar}>
            <input
              type="text"
              placeholder="Código (Ej: COD001)"
              id="filtro-codigo"
              aria-label="Código del inmueble"
              value={filtros.codigo}
              onChange={(e) => setFiltros((p) => ({ ...p, codigo: e.target.value }))}
            />
            <select
              id="filtro-modalidad"
              aria-label="Modalidad"
              value={filtros.modalidad}
              onChange={(e) => setFiltros((p) => ({ ...p, modalidad: e.target.value }))}
            >
              <option value="">Modalidad</option>
              <option value="arriendo">Arriendo</option>
              <option value="venta">Venta</option>
            </select>
            <select
              id="filtro-precio"
              aria-label="Precio máximo"
              value={filtros.precio_max}
              onChange={(e) => setFiltros((p) => ({ ...p, precio_max: e.target.value }))}
            >
              <option value="">Precio máximo</option>
              <option value="500000">Hasta $500.000</option>
              <option value="1000000">Hasta $1.000.000</option>
              <option value="2000000">Hasta $2.000.000</option>
              <option value="5000000">Hasta $5.000.000</option>
              <option value="100000000">Hasta $100.000.000</option>
              <option value="500000000">Hasta $500.000.000</option>
            </select>
            <button type="submit" className="btn-primary" id="btn-buscar">
              Buscar ahora
            </button>
          </form>
        </section>

        {/* ══ INMUEBLES DESTACADOS ══ */}
        <section className="seccion-titulo">
          <h2>Inmuebles destacados</h2>
          <p className="seccion-subtitulo">Las mejores propiedades disponibles para ti</p>
        </section>

        <div className="inmuebles-grid" id="listaInmuebles">
          {cargando ? (
            <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando inmuebles...</p>
          ) : destacados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Building2 className="h-10 w-10" /></div>
              <p className="empty-state-title">No hay inmuebles disponibles en este momento</p>
              <p className="empty-state-sub">Vuelve pronto, estamos cargando nuevas propiedades.</p>
            </div>
          ) : (
            destacados.map((inmueble) => (
              <TarjetaInmueble key={inmueble._id} inmueble={inmueble} />
            ))
          )}
        </div>

        {destacados.length > 0 && (
          <div className="ver-todos-wrap">
            <Link to="/catalogo" className="btn-hero" id="btn-ver-todos">
              Ver todos los inmuebles <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>

      {/* ══ ¿POR QUÉ ELEGIRNOS? ══ */}
      <section className="seccion-porque">
        <div className="container">
          <div className="seccion-titulo">
            <h2>¿Por qué elegirnos?</h2>
            <p className="seccion-subtitulo">Tu confianza es nuestra prioridad</p>
          </div>
          <div className="info-grid">
            <div className="tool-card fade-up">
              <div className="tool-card-icon"><Building2 className="h-7 w-7" /></div>
              <h3>Variedad de propiedades</h3>
              <p>Amplio catálogo con apartamentos, casas y locales comerciales para todos los presupuestos y necesidades.</p>
            </div>
            <div className="tool-card fade-up fade-up-delay-1">
              <div className="tool-card-icon"><Shield className="h-7 w-7" /></div>
              <h3>Transacciones seguras</h3>
              <p>Respaldamos cada operación con asesoría legal especializada y contratos verificados para tu tranquilidad.</p>
            </div>
            <div className="tool-card fade-up fade-up-delay-2">
              <div className="tool-card-icon"><Phone className="h-7 w-7" /></div>
              <h3>Soporte personalizado</h3>
              <p>Nuestros asesores te acompañan en cada paso del proceso, desde la búsqueda hasta la firma del contrato.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="cta-section">
        <div className="container">
          <h2>¿Listo para encontrar tu propiedad ideal?</h2>
          <p>Regístrate gratis y accede a los mejores inmuebles de Neiva con atención personalizada.</p>
          <div className="cta-actions">
            <Link to="/registro" className="btn-hero" id="cta-registrar">
              Comenzar ahora <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/catalogo" className="btn-hero-outline" id="cta-explorar">
              Explorar inmuebles
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
