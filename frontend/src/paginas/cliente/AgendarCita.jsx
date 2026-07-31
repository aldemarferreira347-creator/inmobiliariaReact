import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import * as citasServicio from '../../servicios/citas.servicio';
import * as inmueblesServicio from '../../servicios/inmuebles.servicio';
import SelectorSlot from '../../componentes/citas/SelectorSlot';

function fechaHoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AgendarCita() {
  const { inmuebleId } = useParams();
  const navigate = useNavigate();
  const [inmueble, setInmueble] = useState(null);
  const [fecha, setFecha] = useState(fechaHoyISO());
  const [slots, setSlots] = useState([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  useEffect(() => {
    inmueblesServicio.detalle(inmuebleId).then((data) => setInmueble(data.inmueble));
  }, [inmuebleId]);

  useEffect(() => {
    setSlotSeleccionado(null);
    setCargandoSlots(true);
    citasServicio
      .franjasDisponibles(fecha)
      .then((data) => setSlots(data.slots))
      .finally(() => setCargandoSlots(false));
  }, [fecha]);

  const confirmar = async () => {
    if (!slotSeleccionado) return;
    setMensaje(null);
    setEnviando(true);
    try {
      await citasServicio.solicitar({
        inmuebleId,
        fecha,
        horaInicio: slotSeleccionado.horaInicio,
        horaFin: slotSeleccionado.horaFin,
      });
      navigate('/mis-citas');
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'No se pudo agendar la cita');
    } finally {
      setEnviando(false);
    }
  };

  const hoy = fechaHoyISO();
  const maximo = new Date();
  maximo.setDate(maximo.getDate() + 30);

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <span className="page-hero-badge">
          <Calendar className="h-3.5 w-3.5" /> Agendar visita
        </span>
        <h1>Solicitar cita de visita</h1>
        {inmueble && (
          <p>{inmueble.titulo} <span style={{ opacity: 0.7 }}>· {inmueble.codigo}</span></p>
        )}
      </div>

      <section>
        <div className="container" style={{ maxWidth: 640, paddingBottom: '3rem' }}>

          {/* Selector de fecha */}
          <div className="panel-card" style={{ marginBottom: '1.25rem' }}>
            <div className="panel-card-header">
              <h2><Calendar className="h-5 w-5" /> Elige una fecha</h2>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="fecha">Fecha de la visita</label>
              <input
                id="fecha"
                type="date"
                value={fecha}
                min={hoy}
                max={maximo.toISOString().slice(0, 10)}
                onChange={(e) => setFecha(e.target.value)}
                style={{ maxWidth: 240 }}
              />
            </div>
          </div>

          {/* Selector de horario */}
          <div className="panel-card" style={{ marginBottom: '1.25rem' }}>
            <div className="panel-card-header">
              <h2><Clock className="h-5 w-5" /> Selecciona un horario</h2>
            </div>
            {cargandoSlots ? (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(15,23,42,0.5)' }}>
                Buscando horarios disponibles...
              </p>
            ) : (
              <div style={{ marginTop: '0.75rem' }}>
                <SelectorSlot
                  slots={slots}
                  slotSeleccionado={slotSeleccionado}
                  onSeleccionar={setSlotSeleccionado}
                />
              </div>
            )}
          </div>

          {/* Alerta de error */}
          {mensaje && (
            <div className="alert error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {mensaje}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={confirmar}
              disabled={!slotSeleccionado || enviando}
            >
              <CheckCircle className="h-5 w-5" />
              {enviando ? 'Agendando...' : 'Confirmar cita'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
              Cancelar
            </button>
          </div>

        </div>
      </section>
    </>
  );
}
