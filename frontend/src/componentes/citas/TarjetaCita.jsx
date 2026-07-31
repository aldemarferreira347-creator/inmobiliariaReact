import { Calendar, Clock, User, Building2 } from 'lucide-react';
import { claseEstadoCita } from '../../utilidades/colorEstado';

export default function TarjetaCita({ cita, children }) {
  const fecha = new Date(cita.fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="tarjeta-cita">
      <span className={`tarjeta-cita-estado ${claseEstadoCita(cita.estado)}`}>
        {cita.estado}
      </span>

      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
          <Building2 style={{ display: 'inline', width: 14, height: 14, marginRight: 6, verticalAlign: 'middle', color: 'var(--color-navy-500)' }} />
          {cita.inmueble?.titulo ?? '—'}{cita.inmueble?.codigo ? ` (${cita.inmueble.codigo})` : ''}
        </p>

        <p style={{ fontSize: '0.8125rem', color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)', margin: 0 }}>
          <Calendar style={{ display: 'inline', width: 13, height: 13, marginRight: 5, verticalAlign: 'middle' }} />
          {fecha}
        </p>

        <p style={{ fontSize: '0.8125rem', color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)', margin: 0 }}>
          <Clock style={{ display: 'inline', width: 13, height: 13, marginRight: 5, verticalAlign: 'middle' }} />
          {cita.horaInicio} – {cita.horaFin}
        </p>

        {cita.cliente?.nombre && (
          <p style={{ fontSize: '0.8125rem', color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)', margin: 0 }}>
            <User style={{ display: 'inline', width: 13, height: 13, marginRight: 5, verticalAlign: 'middle' }} />
            Cliente: {cita.cliente.nombre} {cita.cliente.apellido}
            {cita.cliente.telefono ? ` · ${cita.cliente.telefono}` : ''}
          </p>
        )}

        {cita.asesor?.nombre && (
          <p style={{ fontSize: '0.8125rem', color: 'color-mix(in srgb, var(--color-ink) 60%, transparent)', margin: 0 }}>
            <User style={{ display: 'inline', width: 13, height: 13, marginRight: 5, verticalAlign: 'middle', color: '#276749' }} />
            Asesor: {cita.asesor.nombre} {cita.asesor.apellido}
          </p>
        )}
      </div>

      {children && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}
