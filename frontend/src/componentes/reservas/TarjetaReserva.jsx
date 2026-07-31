import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { claseEstadoReserva } from '../../utilidades/colorEstado';
import { urlArchivo } from '../../utilidades/urlArchivo';

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

function tiempoRestante(fechaExpiracion) {
  const diff = new Date(fechaExpiracion) - new Date();
  if (diff <= 0) return null;
  const horas = Math.floor(diff / 3600000);
  const minutos = Math.floor((diff % 3600000) / 60000);
  if (horas > 48) return `${Math.floor(horas / 24)} días`;
  if (horas > 0) return `${horas}h ${minutos}m`;
  return `${minutos}min`;
}

export default function TarjetaReserva({ reserva, children }) {
  const imgSrc = reserva.inmueble?.imagenPrincipal
    ? urlArchivo(reserva.inmueble.imagenPrincipal)
    : 'https://placehold.co/600x400/0f1e4a/ffffff?text=Inmueble';

  const restante = reserva.fechaExpiracion ? tiempoRestante(reserva.fechaExpiracion) : null;
  const vencida = reserva.fechaExpiracion && new Date(reserva.fechaExpiracion) < new Date();

  return (
    <div className="reserva-card">
      <img
        src={imgSrc}
        alt={reserva.inmueble?.titulo ?? 'Reserva'}
        className="reserva-card-img"
        onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/0f1e4a/ffffff?text=Inmueble'; }}
      />

      <div className="reserva-card-body">
        <span className={`reserva-badge ${claseEstadoReserva(reserva.estado)}`}>
          {reserva.estado}
        </span>

        <p className="reserva-codigo">{reserva.codigo}</p>
        <p className="reserva-inmueble-titulo">{reserva.inmueble?.titulo}</p>

        {reserva.inmueble?.ubicacion && (
          <p className="reserva-inmueble-meta">
            <MapPin className="h-3.5 w-3.5" />
            {[reserva.inmueble.ubicacion.barrio, reserva.inmueble.ubicacion.ciudad].filter(Boolean).join(', ')}
          </p>
        )}

        <p className="reserva-monto">{formatoMoneda(reserva.monto)}</p>

        {reserva.fechaExpiracion && (
          <span className={`reserva-countdown${vencida ? ' reserva-countdown--vencida' : ''}`}>
            <Clock className="h-3.5 w-3.5" />
            {vencida ? 'Vencida' : `Vence en ${restante}`}
          </span>
        )}

        <p className="reserva-fecha">
          Creada: {new Date(reserva.createdAt ?? reserva.fechaCreacion ?? Date.now()).toLocaleDateString('es-CO')}
        </p>
      </div>

      <div className="reserva-card-footer">
        <Link to={`/reservas/${reserva._id}`} className="btn-reservas-primary" style={{ textDecoration: 'none' }}>
          Ver detalle <ArrowRight className="h-4 w-4" />
        </Link>
        {children}
      </div>
    </div>
  );
}
