import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Image, Plus, Trash2, Star, ArrowLeft, Save } from 'lucide-react';
import * as inmueblesServicio from '../../servicios/inmuebles.servicio';
import { urlArchivo } from '../../utilidades/urlArchivo';

const TIPOS = ['casa', 'apartamento', 'local', 'oficina', 'lote', 'bodega'];

export default function InmuebleFormulario() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [mensajeOk, setMensajeOk] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [subiendoImg, setSubiendoImg] = useState(false);

  const cargarDatos = async () => {
    if (!editando) return;
    const data = await inmueblesServicio.detalle(id);
    setImagenes(data.imagenes ?? []);
    reset({
      titulo:       data.inmueble.titulo,
      descripcion:  data.inmueble.descripcion,
      tipo:         data.inmueble.tipo,
      modalidad:    data.inmueble.modalidad,
      precio:       data.inmueble.precio,
      habitaciones: data.inmueble.habitaciones,
      banos:        data.inmueble.banos,
      areaM2:       data.inmueble.areaM2,
      ciudad:       data.inmueble.ubicacion?.ciudad,
      barrio:       data.inmueble.ubicacion?.barrio,
      direccion:    data.inmueble.ubicacion?.direccion,
      destacado:    data.inmueble.destacado,
    });
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const guardar = async (datos) => {
    setErrorGeneral(null);
    setMensajeOk(null);
    const payload = {
      titulo:       datos.titulo,
      descripcion:  datos.descripcion,
      tipo:         datos.tipo,
      modalidad:    datos.modalidad,
      precio:       Number(datos.precio),
      habitaciones: Number(datos.habitaciones) || 0,
      banos:        Number(datos.banos) || 0,
      areaM2:       Number(datos.areaM2) || undefined,
      destacado:    Boolean(datos.destacado),
      ubicacion: { ciudad: datos.ciudad, barrio: datos.barrio, direccion: datos.direccion },
    };

    try {
      if (editando) {
        await inmueblesServicio.actualizar(id, payload);
        setMensajeOk('Inmueble actualizado correctamente.');
      } else {
        const creado = await inmueblesServicio.crear(payload);
        navigate(`/administrador/inmuebles/${creado.inmueble._id}/editar`, { replace: true });
        return;
      }
    } catch (error) {
      setErrorGeneral(error.response?.data?.mensaje || 'No se pudo guardar el inmueble');
    }
  };

  const subirImagen = async () => {
    if (!archivoImagen) return;
    setErrorGeneral(null);
    setSubiendoImg(true);
    try {
      await inmueblesServicio.agregarImagen(id, archivoImagen);
      setArchivoImagen(null);
      await cargarDatos();
    } catch (error) {
      setErrorGeneral(error.response?.data?.mensaje || 'No se pudo subir la imagen');
    } finally {
      setSubiendoImg(false);
    }
  };

  const eliminarImagen = async (imagenId) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    await inmueblesServicio.eliminarImagen(id, imagenId);
    await cargarDatos();
  };

  const establecerPrincipal = async (imagenId) => {
    await inmueblesServicio.establecerImagenPrincipal(id, imagenId);
    await cargarDatos();
  };

  return (
    <div>
      {/* Topbar */}
      <div className="panel-topbar">
        <div>
          <button type="button" onClick={() => navigate('/administrador/inmuebles')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem', padding: 0 }}>
            <ArrowLeft className="h-4 w-4" /> Volver a inmuebles
          </button>
          <h1 style={{ margin: 0, fontSize: '1.375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 style={{ width: 22, height: 22, color: 'var(--color-navy-500)' }} />
            {editando ? 'Editar inmueble' : 'Crear inmueble'}
          </h1>
        </div>
      </div>

      {mensajeOk && <div className="alert success" style={{ marginBottom: '1.25rem' }}>{mensajeOk}</div>}
      {errorGeneral && <div className="alert error" style={{ marginBottom: '1.25rem' }}>{errorGeneral}</div>}

      {/* Formulario */}
      <div className="panel-card" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-card-header">
          <h2>Información del inmueble</h2>
        </div>
        <form onSubmit={handleSubmit(guardar)} style={{ marginTop: '1.25rem' }}>
          <div className="form-grid">
            {/* Título */}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label htmlFor="titulo">Título <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="titulo" placeholder="Ej: Apartamento en el centro de Medellín" {...register('titulo', { required: 'El título es obligatorio' })} />
              {errors.titulo && <span className="error-campo" style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.titulo.message}</span>}
            </div>

            {/* Descripción */}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label htmlFor="descripcion">Descripción <span style={{ color: '#ef4444' }}>*</span> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(mínimo 50 caracteres)</span></label>
              <textarea id="descripcion" rows={4} placeholder="Describe el inmueble en detalle..." {...register('descripcion', { required: 'La descripción es obligatoria', minLength: { value: 50, message: 'Mínimo 50 caracteres' } })} />
              {errors.descripcion && <span className="error-campo" style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.descripcion.message}</span>}
            </div>

            {/* Tipo */}
            <div className="form-group">
              <label htmlFor="tipo">Tipo <span style={{ color: '#ef4444' }}>*</span></label>
              <select id="tipo" {...register('tipo', { required: true })}>
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo} style={{ textTransform: 'capitalize' }}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* Modalidad */}
            <div className="form-group">
              <label htmlFor="modalidad">Modalidad <span style={{ color: '#ef4444' }}>*</span></label>
              <select id="modalidad" {...register('modalidad', { required: true })}>
                <option value="arriendo">Arriendo</option>
                <option value="venta">Venta</option>
              </select>
            </div>

            {/* Precio */}
            <div className="form-group">
              <label htmlFor="precio">Precio (COP) <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="precio" type="number" min="0" step="1000" placeholder="0" {...register('precio', { required: 'El precio es obligatorio', min: 0 })} />
              {errors.precio && <span className="error-campo" style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.precio.message}</span>}
            </div>

            {/* Habitaciones */}
            <div className="form-group">
              <label htmlFor="habitaciones">Habitaciones</label>
              <input id="habitaciones" type="number" min="0" placeholder="0" {...register('habitaciones')} />
            </div>

            {/* Baños */}
            <div className="form-group">
              <label htmlFor="banos">Baños</label>
              <input id="banos" type="number" min="0" placeholder="0" {...register('banos')} />
            </div>

            {/* Área */}
            <div className="form-group">
              <label htmlFor="areaM2">Área (m²)</label>
              <input id="areaM2" type="number" min="0" step="0.5" placeholder="0" {...register('areaM2')} />
            </div>

            {/* Ubicación */}
            <div className="form-group">
              <label htmlFor="ciudad">Ciudad <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="ciudad" placeholder="Ej: Medellín" {...register('ciudad', { required: 'La ciudad es obligatoria' })} />
              {errors.ciudad && <span className="error-campo" style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.ciudad.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="barrio">Barrio</label>
              <input id="barrio" placeholder="Ej: El Poblado" {...register('barrio')} />
            </div>
            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <input id="direccion" placeholder="Ej: Calle 10 #43-12" {...register('direccion')} />
            </div>

            {/* Destacado */}
            <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, userSelect: 'none' }}>
                <input type="checkbox" {...register('destacado')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                Marcar como destacado
              </label>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button type="submit" className="btn-panel-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear inmueble')}
            </button>
            <button type="button" onClick={() => navigate('/administrador/inmuebles')} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Gestión de imágenes (solo en modo edición) */}
      {editando && (
        <div className="panel-card">
          <div className="panel-card-header panel-card-header--between">
            <h2><Image className="h-5 w-5" /> Imágenes del inmueble</h2>
            <span className="badge" style={{ backgroundColor: 'var(--color-navy-500)' }}>{imagenes.length}</span>
          </div>

          {imagenes.length === 0 ? (
            <div className="empty-state" style={{ margin: '1rem 0' }}>
              <div className="empty-state-icon"><Image className="h-8 w-8" /></div>
              <p className="empty-state-title">Sin imágenes</p>
              <p className="empty-state-sub">Añade imágenes para que el inmueble sea más atractivo.</p>
            </div>
          ) : (
            <div className="grid-imagenes-admin" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              {imagenes.map((img) => (
                <div key={img._id} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: img.esPrincipal ? '2px solid var(--color-gold-500, #f59e0b)' : '1px solid #e2e8f0' }}>
                  <img src={urlArchivo(img.rutaArchivo)} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                  {img.esPrincipal && (
                    <span style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#f59e0b', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Star style={{ width: 10, height: 10 }} /> Principal
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: '0.25rem', padding: '0.375rem' }}>
                    {!img.esPrincipal && (
                      <button type="button" onClick={() => establecerPrincipal(img._id)} title="Hacer principal" className="btn-icon btn-icon--success" style={{ flex: 1, justifyContent: 'center', fontSize: '0.7rem' }}>
                        <Star className="h-3 w-3" />
                      </button>
                    )}
                    <button type="button" onClick={() => eliminarImagen(img._id)} title="Eliminar" className="btn-icon btn-icon--danger" style={{ flex: 1, justifyContent: 'center' }}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subir nueva imagen */}
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.5rem 0.875rem', cursor: 'pointer', fontSize: '0.875rem', color: '#334155', background: '#f8fafc' }}>
              <Image className="h-4 w-4" />
              {archivoImagen ? archivoImagen.name : 'Seleccionar imagen'}
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => setArchivoImagen(e.target.files[0])} />
            </label>
            {archivoImagen && (
              <button type="button" className="btn-panel-primary" style={{ display: 'flex', gap: 6 }} onClick={subirImagen} disabled={subiendoImg}>
                <Plus className="h-4 w-4" />
                {subiendoImg ? 'Subiendo...' : 'Subir imagen'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
