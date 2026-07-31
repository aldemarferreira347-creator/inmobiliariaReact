import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Ruler, Calendar, Heart, Building2,
  ChevronLeft, ChevronRight, Lock, MessageSquare, Copy, Check,
  ArrowLeft, Shield, Tag, ExternalLink
} from 'lucide-react';
import * as inmueblesServicio from '../../servicios/inmuebles.servicio';
import * as favoritosServicio from '../../servicios/favoritos.servicio';
import * as reservasServicio from '../../servicios/reservas.servicio';
import { useAuth } from '../../contexto/AuthContext';
import { urlArchivo } from '../../utilidades/urlArchivo';

function fmt(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
}

/* ── Mini-slider de imágenes ─────────────────────────── */
function Slider({ imagenes }) {
  const [idx, setIdx] = useState(0);
  const fallback = 'https://placehold.co/800x500/0f1e4a/ffffff?text=Sin+imagen';
  const total = imagenes.length;

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  if (total === 0) {
    return (
      <div style={{ borderRadius: '1rem', overflow: 'hidden', background: '#f8fafc', boxShadow: '0 8px 32px rgba(15,30,74,0.18)', border: '1px solid #e2e8f0' }}>
        <div style={{ aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          Sin imágenes disponibles
        </div>
      </div>
    );
  }

  const src = urlArchivo(imagenes[idx].rutaArchivo ?? imagenes[idx].url);

  return (
    <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', background: '#0f1e4a', boxShadow: '0 8px 32px rgba(15,30,74,0.18)' }}>
      {/* Imagen principal */}
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
        <img
          src={src}
          alt={`Imagen ${idx + 1}`}
          onError={(e) => { e.target.src = fallback; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
        />
        {/* Contador */}
        {total > 1 && (
          <span style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '999px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: 600 }}>
            {idx + 1} / {total}
          </span>
        )}
      </div>

      {/* Botones de navegación */}
      {total > 1 && (
        <>
          <button type="button" onClick={prev} aria-label="Imagen anterior" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <ChevronLeft style={{ width: 20, height: 20, color: '#0f1e4a' }} />
          </button>
          <button type="button" onClick={next} aria-label="Imagen siguiente" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <ChevronRight style={{ width: 20, height: 20, color: '#0f1e4a' }} />
          </button>
        </>
      )}

      {/* Miniaturas */}
      {total > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 10px', overflowX: 'auto', background: 'rgba(15,30,74,0.06)' }}>
          {imagenes.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              style={{
                flex: '0 0 70px',
                height: 50,
                borderRadius: '0.375rem',
                overflow: 'hidden',
                border: i === idx ? '2px solid #f59e0b' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                background: 'none',
                transition: 'border-color 0.15s',
              }}
            >
              <img
                src={urlArchivo(img.rutaArchivo ?? img.url)}
                alt={`Miniatura ${i + 1}`}
                onError={(e) => { e.target.src = fallback; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Badge de estado ─────────────────────────────────── */
function BadgeEstado({ estado }) {
  const map = {
    disponible: { bg: '#dcfce7', color: '#166534', label: 'Disponible' },
    reservado:  { bg: '#fef9c3', color: '#854d0e', label: 'Reservado' },
    ocupado:    { bg: '#fee2e2', color: '#991b1b', label: 'Ocupado' },
  };
  const e = map[(estado ?? 'disponible').toLowerCase()] ?? map.disponible;
  return (
    <span style={{ backgroundColor: e.bg, color: e.color, padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {e.label}
    </span>
  );
}

export default function DetalleInmueble() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const navegar = useNavigate();

  const [datos, setDatos] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorReserva, setErrorReserva] = useState('');
  const [reservando, setReservando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const isCliente = usuario?.rol === 'cliente';
  const puedeAgendar = isCliente;
  const puedeReservar = isCliente;

  useEffect(() => {
    inmueblesServicio.detalle(id).then((res) => {
      setDatos(res.inmueble ?? res);
      setImagenes(res.imagenes ?? []);
    }).finally(() => setCargando(false));

    if (isCliente) {
      favoritosServicio.listar().then((res) => {
        setEsFavorito(res.inmuebles?.some((f) => f._id === id));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, usuario]);

  const alternarFavorito = async () => {
    const r = await favoritosServicio.alternar(id);
    setEsFavorito(r.esFavorito);
  };

  const reservar = async () => {
    setErrorReserva('');
    setReservando(true);
    try {
      const { reserva } = await reservasServicio.iniciar(id);
      navegar(`/reservas/${reserva._id}`);
    } catch (e) {
      setErrorReserva(e.response?.data?.mensaje || 'No se pudo iniciar la reserva.');
      setReservando(false);
    }
  };

  const copiarCodigo = () => {
    if (!datos?.codigo) return;
    navigator.clipboard.writeText(datos.codigo).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  if (cargando) return <div style={{ padding: '5rem', textAlign: 'center', color: '#64748b' }}>Cargando detalles...</div>;
  if (!datos)  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h2 style={{ color: '#0f1e4a' }}>Inmueble no encontrado</h2>
      <Link to="/catalogo" style={{ color: '#f59e0b', marginTop: '1rem', display: 'inline-block' }}>← Volver al catálogo</Link>
    </div>
  );

  const inmueble = datos;
  const estadoRaw = (inmueble.estado ?? 'disponible').toLowerCase();
  const mapsQuery = encodeURIComponent(`${inmueble.ubicacion?.direccion ?? ''}, ${inmueble.ubicacion?.barrio ?? ''}, ${inmueble.ubicacion?.ciudad ?? ''}, Colombia`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapsEmbed = `https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=15&hl=es`;

  return (
    <div className="detalle-page" style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* Barra de volver */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(15,23,42,0.08)', padding: '0.625rem 0' }}>
        <div className="container">
          <Link to="/catalogo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} /> Volver a inmuebles
          </Link>
        </div>
      </div>

      {/* ── SECCIÓN HERO: Slider + Tarjeta ── */}
      <section style={{ background: '#fff', paddingTop: '1.75rem', paddingBottom: '1.75rem', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

            {/* Slider */}
            <Slider imagenes={imagenes} />

            {/* Tarjeta flotante de precio */}
            <div style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(15,23,42,0.08)', position: 'sticky', top: 90 }}>

              {/* Favorito */}
              {isCliente && (
                <button
                  type="button"
                  onClick={alternarFavorito}
                  aria-label={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  style={{ float: 'right', background: esFavorito ? '#fef2f2' : '#f8fafc', border: `1px solid ${esFavorito ? '#fecaca' : '#e2e8f0'}`, borderRadius: '0.5rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: '0.8rem', color: esFavorito ? '#dc2626' : '#64748b', fontWeight: 500, transition: 'all 0.15s' }}
                >
                  <Heart style={{ width: 16, height: 16 }} fill={esFavorito ? 'currentColor' : 'none'} />
                  {esFavorito ? 'Guardado' : 'Guardar'}
                </button>
              )}

              {/* Precio */}
              <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.25rem', marginTop: 0 }}>
                {inmueble.modalidad === 'arriendo' ? 'Valor mensual' : 'Precio de venta'}
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0f1e4a', margin: '0 0 1rem', lineHeight: 1.1 }}>
                {fmt(inmueble.precio)}
              </p>

              {/* Badges estado/modalidad */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <BadgeEstado estado={inmueble.estado} />
                {inmueble.modalidad && (
                  <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {inmueble.modalidad}
                  </span>
                )}
              </div>

              {/* Código del inmueble */}
              {inmueble.codigo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', marginBottom: '1.25rem' }}>
                  <Building2 style={{ width: 15, height: 15, color: '#64748b' }} />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Código:</span>
                  <strong style={{ fontSize: '0.875rem', color: '#0f1e4a', fontFamily: 'monospace' }}>{inmueble.codigo}</strong>
                  <button type="button" onClick={copiarCodigo} title="Copiar código" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: copiado ? '#22c55e' : '#94a3b8', padding: 0, display: 'flex' }}>
                    {copiado ? <Check style={{ width: 15, height: 15 }} /> : <Copy style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              )}

              {/* Características rápidas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {[
                  { icon: Bed,   label: `${inmueble.habitaciones ?? '-'} Hab.` },
                  { icon: Bath,  label: `${inmueble.banos ?? '-'} Baños` },
                  { icon: Ruler, label: `${inmueble.areaM2 ?? '-'} m²` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                    <Icon style={{ width: 18, height: 18, color: '#0f1e4a', display: 'block', margin: '0 auto 2px' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {puedeAgendar ? (
                  <Link
                    to={`/citas/agendar/${id}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f59e0b', color: '#0f1e4a', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none', transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <Calendar style={{ width: 18, height: 18 }} /> Agendar visita
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f59e0b', color: '#0f1e4a', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}
                  >
                    <Calendar style={{ width: 18, height: 18 }} /> Agendar visita
                  </Link>
                )}

                {estadoRaw === 'disponible' && (
                  puedeReservar ? (
                    <button
                      type="button"
                      onClick={reservar}
                      disabled={reservando}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f1e4a', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', border: 'none', cursor: reservando ? 'not-allowed' : 'pointer', opacity: reservando ? 0.7 : 1, transition: 'opacity 0.15s' }}
                    >
                      <Lock style={{ width: 18, height: 18 }} />
                      {reservando ? 'Procesando...' : 'Reservar propiedad'}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f1e4a', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}
                    >
                      <Lock style={{ width: 18, height: 18 }} /> Iniciar sesión para reservar
                    </Link>
                  )
                )}

                {estadoRaw === 'reservado' && (
                  <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e2e8f0', color: '#64748b', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', border: 'none', cursor: 'not-allowed' }}>
                    Reservado temporalmente
                  </button>
                )}

                {errorReserva && (
                  <p style={{ color: '#dc2626', fontSize: '0.8125rem', textAlign: 'center', margin: 0 }}>{errorReserva}</p>
                )}
              </div>

              {/* Contacto */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#0f1e4a', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                  GI
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.875rem', color: '#0f1e4a' }}>¿Tienes preguntas?</strong>
                  <p style={{ margin: '0.1rem 0 0.3rem', fontSize: '0.75rem', color: '#64748b' }}>Contáctanos directamente</p>
                  {isCliente ? (
                    <Link to="/mensajes" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                      <MessageSquare style={{ width: 13, height: 13 }} /> Enviar mensaje
                    </Link>
                  ) : (
                    <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                      <MessageSquare style={{ width: 13, height: 13 }} /> Iniciar sesión para contactar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

          {/* COLUMNA IZQUIERDA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Título y descripción */}
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
              <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, color: '#0f1e4a', margin: '0 0 0.5rem' }}>
                {inmueble.titulo}
              </h1>
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.9375rem', margin: '0 0 1.5rem' }}>
                <MapPin style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0 }} />
                {[inmueble.ubicacion?.direccion, inmueble.ubicacion?.barrio, inmueble.ubicacion?.ciudad].filter(Boolean).join(', ')}
              </p>

              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f1e4a', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                Descripción
              </h2>
              <div style={{ color: '#475569', lineHeight: 1.75, fontSize: '0.9375rem' }}>
                {inmueble.descripcion
                  ? inmueble.descripcion.split('\n').map((p, i) => <p key={i} style={{ margin: '0 0 0.5rem' }}>{p}</p>)
                  : <p style={{ color: '#94a3b8' }}>Sin descripción disponible.</p>}
              </div>

              {/* Amenities grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' }}>
                {[
                  { icon: Bed,      label: 'Habitaciones', valor: inmueble.habitaciones ?? '—' },
                  { icon: Bath,     label: 'Baños',        valor: inmueble.banos ?? '—' },
                  { icon: Ruler,    label: 'Área',         valor: inmueble.areaM2 ? `${inmueble.areaM2} m²` : '—' },
                  { icon: Building2,label: 'Tipo',         valor: inmueble.tipo ? (inmueble.tipo.charAt(0).toUpperCase() + inmueble.tipo.slice(1)) : '—' },
                  { icon: Shield,   label: 'Estado',       valor: inmueble.estado ?? '—' },
                  { icon: Tag,      label: 'Modalidad',    valor: inmueble.modalidad ? (inmueble.modalidad.charAt(0).toUpperCase() + inmueble.modalidad.slice(1)) : '—' },
                ].map(({ icon: Icon, label, valor }) => (
                  <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(15,30,74,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                      <Icon style={{ width: 20, height: 20, color: '#0f1e4a' }} />
                    </div>
                    <strong style={{ display: 'block', fontSize: '1rem', color: '#0f1e4a', fontWeight: 700 }}>{valor}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mapa */}
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f1e4a', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                <MapPin style={{ width: 18, height: 18, color: '#f59e0b' }} /> Ubicación
              </h2>
              <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <iframe
                  title="Mapa de ubicación"
                  src={mapsEmbed}
                  style={{ width: '100%', height: 280, border: 'none', display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.9375rem' }}>
                    {[inmueble.ubicacion?.direccion, inmueble.ubicacion?.barrio].filter(Boolean).join(', ')}
                  </p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                    {inmueble.ubicacion?.ciudad}, Colombia
                  </p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#1e40af', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}
                >
                  Ver en Google Maps <ExternalLink style={{ width: 14, height: 14 }} />
                </a>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA — Formulario de contacto */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f1e4a', margin: '0 0 0.25rem' }}>
                ¿Te interesa este inmueble?
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>
                Envíanos un mensaje y un asesor te contactará pronto.
              </p>

              <ContactForm inmueble={inmueble} usuario={usuario} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Formulario de contacto ──────────────────────────── */
function ContactForm({ inmueble, usuario }) {
  const [nombre,   setNombre]   = useState(usuario ? `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim() : '');
  const [correo,   setCorreo]   = useState(usuario?.correo ?? '');
  const [telefono, setTelefono] = useState('');
  const [mensaje,  setMensaje]  = useState(`Hola, solicito información del inmueble con código ${inmueble?.codigo ?? ''}.`);
  const [estado,   setEstado]   = useState(null); // { tipo, texto }
  const [enviando, setEnviando] = useState(false);
  const MAX = 2000;

  const enviar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { setEstado({ tipo: 'error', texto: 'Por favor ingresa tu nombre.' }); return; }
    if (!correo.trim()) { setEstado({ tipo: 'error', texto: 'Por favor ingresa tu correo.' }); return; }
    if (!mensaje.trim()) { setEstado({ tipo: 'error', texto: 'Por favor escribe un mensaje.' }); return; }
    setEstado(null);
    setEnviando(true);
    try {
      // Importación dinámica para no crear dep circular
      const srv = await import('../../servicios/mensajes.servicio');
      await srv.enviarContacto({ nombre, correo, telefono, mensaje, inmuebleId: inmueble?._id });
      setEstado({ tipo: 'success', texto: '¡Mensaje enviado! Un asesor te contactará pronto.' });
      setMensaje('');
    } catch {
      setEstado({ tipo: 'error', texto: 'No se pudo enviar el mensaje. Intenta de nuevo.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate>
      {estado && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', backgroundColor: estado.tipo === 'success' ? '#f0fdf4' : '#fef2f2', color: estado.tipo === 'success' ? '#166534' : '#991b1b', border: `1px solid ${estado.tipo === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {estado.texto}
        </div>
      )}

      {[
        { id: 'c-nombre',  label: 'Nombre',     type: 'text',  value: nombre,   set: setNombre,  placeholder: 'Tu nombre completo', required: true },
        { id: 'c-email',   label: 'Correo',     type: 'email', value: correo,   set: setCorreo,  placeholder: 'tu@correo.com',      required: true },
        { id: 'c-telefono',label: 'Teléfono',   type: 'tel',   value: telefono, set: setTelefono,placeholder: 'Opcional',           required: false },
      ].map(({ id, label, type, value, set, placeholder, required }) => (
        <div key={id} style={{ marginBottom: '0.875rem' }}>
          <label htmlFor={id} style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
            {label} {!required && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span>}
          </label>
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => set(e.target.value)}
            placeholder={placeholder}
            required={required}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: '#1e293b', background: '#f8fafc', outline: 'none', transition: 'border-color 0.15s' }}
            onFocus={(e) => { e.target.style.borderColor = '#0f1e4a'; e.target.style.background = '#fff'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
          />
        </div>
      ))}

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="c-mensaje" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Mensaje</label>
        <textarea
          id="c-mensaje"
          rows={4}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value.slice(0, MAX))}
          placeholder="Hola, estoy interesado en esta propiedad..."
          required
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: '#1e293b', background: '#f8fafc', resize: 'vertical', outline: 'none', fontFamily: 'inherit', minHeight: 90 }}
          onFocus={(e) => { e.target.style.borderColor = '#0f1e4a'; e.target.style.background = '#fff'; }}
          onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
        />
        <span style={{ fontSize: '0.7rem', color: mensaje.length > MAX * 0.9 ? '#f59e0b' : '#94a3b8' }}>
          {mensaje.length} / {MAX}
        </span>
      </div>

      <button
        type="submit"
        disabled={enviando}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f1e4a', color: '#fff', padding: '0.8rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', border: 'none', cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1, transition: 'opacity 0.15s', fontFamily: 'inherit' }}
      >
        <MessageSquare style={{ width: 18, height: 18 }} />
        {enviando ? 'Enviando...' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
