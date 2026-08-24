import { useEffect, useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import * as citasServicio from '../../servicios/citas.servicio';
import TarjetaCita from '../../componentes/citas/TarjetaCita';
import Modal from '../../componentes/comunes/Modal';
import AdminCitaDetalle from './AdminCitaDetalle';
import { useToast } from '../../contexto/ToastContext';

export default function CitasAdmin() {
  const [sinAsignar, setSinAsignar] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [seleccion, setSeleccion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [citaDetalleId, setCitaDetalleId] = useState(null);
  const toast = useToast();

  const cargar = async () => {
    setCargando(true);
    const [a, b, c] = await Promise.all([
      citasServicio.sinAsignar(),
      citasServicio.agrupadasPorAsesor(),
      citasServicio.asesoresDisponibles(),
    ]);
    setSinAsignar(a.citas);
    setGrupos(b.grupos);
    setAsesores(c.asesores);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const asignar = async (citaId) => {
    const asesorId = seleccion[citaId];
    if (!asesorId) return;
    try {
      await citasServicio.asignar(citaId, asesorId);
      await cargar();
      toast.exito('Asesor asignado correctamente.');
    } catch (e) {
      toast.error(e.response?.data?.mensaje || 'No se pudo asignar el asesor.');
    }
  };

  if (cargando) return <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando citas...</p>;

  const totalCitas = grupos.reduce((acc, g) => acc + g.citas.length, 0);

  return (
    <div>
      <div className="panel-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            Gestión de citas
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'rgba(15,23,42,0.55)' }}>
            {sinAsignar.length} sin asignar · {totalCitas} asignadas
          </p>
        </div>
      </div>

      {/* Sin asignar */}
      <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-card-header panel-card-header--between">
          <h2><Calendar className="h-5 w-5" /> Sin asignar</h2>
          <span className="accent-orange">{sinAsignar.length}</span>
        </div>

        {sinAsignar.length === 0 ? (
          <p style={{ color: 'rgba(15,23,42,0.5)', textAlign: 'center', padding: '1rem' }}>
            No hay citas pendientes por asignar. 🎉
          </p>
        ) : (
          sinAsignar.map((cita) => (
            <TarjetaCita key={cita._id} cita={cita}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={seleccion[cita._id] || ''}
                  onChange={(e) => setSeleccion((prev) => ({ ...prev, [cita._id]: e.target.value }))}
                  style={{ flex: 1, minWidth: '160px' }}
                >
                  <option value="">Selecciona un asesor</option>
                  {asesores.map((a) => (
                    <option key={a._id} value={a._id}>{a.nombre} {a.apellido}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-panel-primary"
                  onClick={() => asignar(cita._id)}
                  disabled={!seleccion[cita._id]}
                >
                  Asignar
                </button>
              </div>
            </TarjetaCita>
          ))
        )}
      </div>

      {/* Agrupadas por asesor */}
      <div className="panel-card">
        <div className="panel-card-header">
          <h2><Users className="h-5 w-5" /> Agrupadas por asesor</h2>
        </div>
        {grupos.length === 0 ? (
          <p style={{ color: 'rgba(15,23,42,0.5)', textAlign: 'center', padding: '1rem' }}>No hay citas asignadas.</p>
        ) : (
          grupos.map((grupo) => (
            <div key={grupo.asesor?._id ?? 'sin-asesor'} className="asesor-group">
              <p className="asesor-group-title">
                <Users className="h-4 w-4" />
                {grupo.asesor ? `${grupo.asesor.nombre} ${grupo.asesor.apellido}` : 'Sin asesor'}
                <span className="asesor-group-count">({grupo.citas.length} citas)</span>
              </p>
              {grupo.citas.map((cita) => (
                <TarjetaCita key={cita._id} cita={cita}>
                  <button
                    type="button"
                    onClick={() => setCitaDetalleId(cita._id)}
                    className="btn-icon btn-icon--info"
                    title="Ver detalle"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', marginTop: '0.25rem' }}
                  >
                    Ver detalle
                  </button>
                </TarjetaCita>
              ))}
            </div>
          ))
        )}
      </div>

      <Modal abierto={Boolean(citaDetalleId)} onCerrar={() => setCitaDetalleId(null)} titulo="Detalle de cita" tamano="lg">
        {citaDetalleId && <AdminCitaDetalle id={citaDetalleId} />}
      </Modal>
    </div>
  );
}
