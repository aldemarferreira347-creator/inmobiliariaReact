import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

const TIPOS = ['Apartamento', 'Casa', 'Local', 'Oficina', 'Bodega', 'Lote', 'Finca'];

export default function FiltrosCatalogo({ onFiltrar }) {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    codigo:       searchParams.get('codigo')      ?? '',
    ubicacion:    searchParams.get('ubicacion')   ?? '',
    modalidad:    searchParams.get('modalidad')   ?? '',
    tipo:         searchParams.get('tipo')        ?? '',
    precio_min:   searchParams.get('precio_min')  ?? '',
    precio_max:   searchParams.get('precio_max')  ?? '',
    habitaciones: searchParams.get('habitaciones')?? '',
  });

  // Aplicar filtros desde URL al montar
  useEffect(() => {
    const hayFiltros = Object.values(form).some(Boolean);
    if (hayFiltros) onFiltrar(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiar = (campo, valor) => setForm((p) => ({ ...p, [campo]: valor }));

  const aplicar = (e) => {
    e.preventDefault();
    onFiltrar(form);
  };

  const limpiar = () => {
    const limpio = { codigo: '', ubicacion: '', modalidad: '', tipo: '', precio_min: '', precio_max: '', habitaciones: '' };
    setForm(limpio);
    onFiltrar(limpio);
  };

  const hayFiltros = Object.values(form).some(Boolean);

  return (
    <div className="filtros">
      <h2>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        Buscar inmuebles
      </h2>
      <form className="filtro-inputs" onSubmit={aplicar} id="form-filtros">
        <input
          type="text" id="filtro-codigo"
          placeholder="Código (Ej: COD001)"
          aria-label="Código del inmueble"
          value={form.codigo}
          onChange={(e) => cambiar('codigo', e.target.value)}
        />
        <input
          type="text" id="filtro-ubicacion"
          placeholder="Ciudad o barrio"
          aria-label="Ciudad o barrio"
          value={form.ubicacion}
          onChange={(e) => cambiar('ubicacion', e.target.value)}
        />
        <select id="filtro-modalidad" aria-label="Modalidad" value={form.modalidad} onChange={(e) => cambiar('modalidad', e.target.value)}>
          <option value="">Modalidad</option>
          <option value="arriendo">Arriendo</option>
          <option value="venta">Venta</option>
        </select>
        <select id="filtro-tipo" aria-label="Tipo de propiedad" value={form.tipo} onChange={(e) => cambiar('tipo', e.target.value)}>
          <option value="">Tipo de propiedad</option>
          {TIPOS.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
        </select>
        <select id="filtro-precio-min" aria-label="Precio mínimo" value={form.precio_min} onChange={(e) => cambiar('precio_min', e.target.value)}>
          <option value="">Precio mínimo</option>
          <option value="500000">Desde $500.000</option>
          <option value="1000000">Desde $1.000.000</option>
          <option value="2000000">Desde $2.000.000</option>
          <option value="5000000">Desde $5.000.000</option>
          <option value="100000000">Desde $100.000.000</option>
          <option value="500000000">Desde $500.000.000</option>
        </select>
        <select id="filtro-precio" aria-label="Precio máximo" value={form.precio_max} onChange={(e) => cambiar('precio_max', e.target.value)}>
          <option value="">Precio máximo</option>
          <option value="500000">Hasta $500.000</option>
          <option value="1000000">Hasta $1.000.000</option>
          <option value="2000000">Hasta $2.000.000</option>
          <option value="5000000">Hasta $5.000.000</option>
          <option value="100000000">Hasta $100.000.000</option>
          <option value="500000000">Hasta $500.000.000</option>
          <option value="1000000000">Hasta $1.000.000.000</option>
        </select>
        <select id="filtro-hab" aria-label="Habitaciones" value={form.habitaciones} onChange={(e) => cambiar('habitaciones', e.target.value)}>
          <option value="">Habitaciones</option>
          <option value="1">1 habitación</option>
          <option value="2">2 habitaciones</option>
          <option value="3">3 o más</option>
        </select>
        <div className="botones-filtro">
          <button type="submit" className="btn-primary" id="btn-filtrar">Buscar</button>
          {hayFiltros && (
            <button type="button" className="btn-limpiar" id="btn-limpiar" onClick={limpiar}>
              <X className="h-4 w-4" /> Limpiar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
