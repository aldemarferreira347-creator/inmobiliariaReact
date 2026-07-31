// Clases Tailwind para los badges de estado (fondo claro + texto de color, igual que el
// sistema de diseño del PHP original: .estado.disponible/.badge-confirmada/etc).

const NEUTRO = 'bg-black/10 text-ink/60';

const MAPA_INMUEBLE = {
  Disponible: 'bg-emerald-500/15 text-emerald-700',
  Reservado: 'bg-gold-500/20 text-gold-600',
  Ocupado: NEUTRO,
};

const MAPA_CITA = {
  Pendiente: 'bg-gold-500/20 text-gold-600',
  Asignada: 'bg-navy-500/15 text-navy-700',
  Realizada: 'bg-emerald-500/15 text-emerald-700',
  Cancelada: NEUTRO,
};

const MAPA_RESERVA = {
  PENDIENTE_PAGO: 'bg-gold-500/20 text-gold-600',
  PROCESANDO_PAGO: 'bg-gold-500/20 text-gold-600',
  CONFIRMADA: 'bg-emerald-500/15 text-emerald-700',
  RECHAZADA: 'bg-red-500/15 text-red-700',
  CANCELADA: NEUTRO,
  EXPIRADA: NEUTRO,
};

const MAPA_CONTRATO = {
  Vigente: 'bg-emerald-500/15 text-emerald-700',
  Vencido: 'bg-red-500/15 text-red-700',
  Rescindido: NEUTRO,
};

const MAPA_VENTA = {
  'En proceso': 'bg-gold-500/20 text-gold-600',
  Finalizada: 'bg-emerald-500/15 text-emerald-700',
  Cancelada: NEUTRO,
};

export const claseEstadoInmueble = (estado) => MAPA_INMUEBLE[estado] || NEUTRO;
export const claseEstadoCita = (estado) => MAPA_CITA[estado] || NEUTRO;
export const claseEstadoReserva = (estado) => MAPA_RESERVA[estado] || NEUTRO;
export const claseEstadoContrato = (estado) => MAPA_CONTRATO[estado] || NEUTRO;
export const claseEstadoVenta = (estado) => MAPA_VENTA[estado] || NEUTRO;
