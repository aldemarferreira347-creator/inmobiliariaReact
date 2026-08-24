import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

const DURACION_MS = { success: 4000, info: 4000, warning: 5000, error: 6000 };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const quitar = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notificar = useCallback((tipo, texto) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, tipo, texto }]);
    setTimeout(() => quitar(id), DURACION_MS[tipo] ?? 4000);
  }, [quitar]);

  const valor = {
    exito: (texto) => notificar('success', texto),
    error: (texto) => notificar('error', texto),
    info:  (texto) => notificar('info', texto),
    advertencia: (texto) => notificar('warning', texto),
  };

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 200,
          display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 'min(360px, calc(100vw - 2rem))',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} className={`alert ${t.tipo}`} style={{ marginBottom: 0, boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }}>
            <span style={{ flex: 1 }}>{t.texto}</span>
            <button
              type="button"
              onClick={() => quitar(t.id)}
              aria-label="Cerrar alerta"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', opacity: 0.7 }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return contexto;
}
