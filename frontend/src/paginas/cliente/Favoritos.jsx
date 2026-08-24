import { useEffect, useState } from 'react';
import { Heart, Search, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as favoritosServicio from '../../servicios/favoritos.servicio';
import TarjetaInmueble from '../../componentes/inmuebles/TarjetaInmueble';

export default function Favoritos() {
  const [inmuebles, setInmuebles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = () => {
    setCargando(true);
    favoritosServicio
      .listar()
      .then((data) => setInmuebles(data.inmuebles ?? []))
      .catch(() => setInmuebles([]))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const quitarFav = async (inmuebleId) => {
    setError('');
    try {
      await favoritosServicio.alternar(inmuebleId);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo quitar de favoritos.');
    }
  };

  return (
    <>
      <div className="page-hero">
        <span className="page-hero-badge">
          <Heart className="h-3.5 w-3.5" /> Mis favoritos
        </span>
        <h1>Propiedades guardadas</h1>
        <p>Los inmuebles que te interesan para revisar más tarde</p>
      </div>

      <section>
        <div className="container propiedades-container">
          {error && (
            <div className="auth-alert error" style={{ marginBottom: '1rem' }}>
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {cargando ? (
            <p style={{ padding: '2rem 0', textAlign: 'center' }}>
              Cargando favoritos...
            </p>
          ) : inmuebles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Heart className="h-10 w-10" /></div>
              <p className="empty-state-title">
                Aún no tienes propiedades guardadas
              </p>
              <p className="empty-state-sub">Explora nuestro catálogo y guarda los inmuebles que más te gusten.</p>
              <Link to="/catalogo" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Search className="h-4 w-4" /> Explorar inmuebles
              </Link>
            </div>
          ) : (
            <div className="inmuebles-grid" id="listaInmuebles">
              {inmuebles.map((inmueble) => (
                <TarjetaInmueble 
                  key={inmueble._id} 
                  inmueble={inmueble} 
                  mostrarQuitarFav 
                  onQuitarFav={quitarFav}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
