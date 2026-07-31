import { Link } from 'react-router-dom';
import { Home, ArrowLeft, MapPin } from 'lucide-react';

export default function NoEncontrado() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1e4a 0%, #1a3476 50%, #0f1e4a 100%)',
      padding: '2rem',
      fontFamily: 'var(--font-body, "Inter", sans-serif)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        {/* Icono animado */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(245,166,35,0.4)',
          marginBottom: '2rem',
          animation: 'pulse 2.5s ease-in-out infinite',
        }}>
          <MapPin style={{ width: 48, height: 48, color: '#f5a623' }} />
        </div>

        {/* Número 404 */}
        <div style={{
          fontSize: 'clamp(5rem, 18vw, 9rem)',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #f5a623, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          letterSpacing: '-4px',
        }}>
          404
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
          fontWeight: 700,
          color: '#ffffff',
          margin: '0 0 0.75rem',
        }}>
          Página no encontrada
        </h1>

        {/* Descripción */}
        <p style={{
          fontSize: '1rem',
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.6,
          margin: '0 0 2.5rem',
        }}>
          La dirección que buscas no existe o fue movida. Revisa la URL o regresa al inicio para encontrar lo que necesitas.
        </p>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#f5a623',
              color: '#0f1e4a',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 4px 20px rgba(245,166,35,0.35)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Home style={{ width: 18, height: 18 }} />
            Ir al inicio
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              padding: '0.75rem 1.75rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem',
              border: '1px solid rgba(255,255,255,0.25)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
            Volver atrás
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.08); opacity: 0.85; }
          }
        `}</style>
      </div>
    </div>
  );
}
