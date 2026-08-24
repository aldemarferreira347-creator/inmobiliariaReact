import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ abierto, onCerrar, titulo, tamano = 'md', children }) {
  useEffect(() => {
    if (!abierto) return;
    const alPresionarTecla = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div className="modal-overlay is-open" onClick={onCerrar}>
      <div
        className={`modal-box ${tamano === 'lg' ? 'modal-box--lg' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-box-header">
          <h2>{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.5)', display: 'flex' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
