import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Ruler, Tag, ArrowRight } from 'lucide-react';
import { urlArchivo } from '../../utilidades/urlArchivo';

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

export default function TarjetaInmueble({ inmueble, mostrarQuitarFav = false, onQuitarFav }) {
  const estado = (inmueble.estado ?? 'disponible').toLowerCase();
  const ubicacion = [inmueble.ubicacion?.barrio, inmueble.ubicacion?.ciudad].filter(Boolean).join(', ') || 'Neiva, Huila';

  const precios = [];
  if (inmueble.precio) {
    const label = inmueble.modalidad === 'arriendo' ? 'Arriendo mensual' : 'Precio de venta';
    precios.push({ label, valor: formatoMoneda(inmueble.precio) + (inmueble.modalidad === 'arriendo' ? '/mes' : '') });
  }

  return (
    <article className="card">
      <div className="card-img-wrap">
        {inmueble.imagenPrincipal ? (
          <img
            src={urlArchivo(inmueble.imagenPrincipal)}
            alt={inmueble.titulo}
            loading="lazy"
            decoding="async"
            className="img-lazy-fade"
            onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://placehold.co/600x400/0f1e4a/ffffff?text=Inmueble';
              e.currentTarget.classList.add('is-loaded');
            }}
          />
        ) : (
          <img
            src="https://placehold.co/600x400/0f1e4a/ffffff?text=Sin+Imagen"
            alt="Sin imagen"
            className="img-lazy-fade is-loaded"
          />
        )}

        {mostrarQuitarFav && onQuitarFav && (
          <button
            type="button"
            className="btn-toggle-fav-card"
            aria-label="Quitar de favoritos"
            onClick={() => onQuitarFav(inmueble._id)}
          >
            ♥
          </button>
        )}

        {inmueble.codigo && (
          <span className="codigo-badge">
            <Tag className="h-3.5 w-3.5" /> {inmueble.codigo}
          </span>
        )}
      </div>

      <div className="card-body">
        <span className={`estado ${estado}`}>
          {inmueble.estado ?? 'Disponible'}
        </span>

        <h3>{inmueble.titulo}</h3>

        <p className="card-location">
          <MapPin className="h-4 w-4" /> {ubicacion}
        </p>

        <div className="card-features">
          {inmueble.habitaciones != null && (
            <span><Bed className="h-4 w-4" /> {inmueble.habitaciones} hab.</span>
          )}
          {inmueble.banos != null && (
            <span><Bath className="h-4 w-4" /> {inmueble.banos} baños</span>
          )}
          {inmueble.areaM2 != null && (
            <span><Ruler className="h-4 w-4" /> {inmueble.areaM2} m²</span>
          )}
        </div>

        <div className="precios-card">
          {precios.map((p) => (
            <p key={p.label} className="precio-card">
              <span className="precio-label">{p.label}:</span>
              <span className="precio-valor">{p.valor}</span>
            </p>
          ))}
        </div>

        <Link to={`/inmuebles/${inmueble._id}`} className="btn-ver" style={{ marginTop: '0.5rem' }}>
          Ver detalle <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
