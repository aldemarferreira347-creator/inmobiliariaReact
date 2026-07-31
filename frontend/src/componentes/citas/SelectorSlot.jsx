export default function SelectorSlot({ slots, slotSeleccionado, onSeleccionar }) {
  if (!slots || slots.length === 0) {
    return <p>No hay horarios configurados para este dia.</p>;
  }

  return (
    <div className="selector-slots">
      {slots.map((slot) => {
        const seleccionado = slotSeleccionado?.horaInicio === slot.horaInicio;
        return (
          <button
            key={slot.horaInicio}
            type="button"
            disabled={!slot.disponible}
            className={seleccionado ? 'slot seleccionado' : 'slot'}
            onClick={() => onSeleccionar(slot)}
          >
            {slot.horaInicio}
          </button>
        );
      })}
    </div>
  );
}
