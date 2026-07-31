import { Outlet } from 'react-router-dom';
import BarraNavegacion from '../componentes/comunes/BarraNavegacion';
import Footer from '../componentes/comunes/Footer';

const ENLACES_PUBLICO = [
  { to: '/',         texto: 'Inicio' },
  { to: '/catalogo', texto: 'Inmuebles' },
];

export default function LayoutPublico() {
  return (
    <div className="layout-publico">
      <BarraNavegacion enlaces={ENLACES_PUBLICO} />
      <main style={{ flex: 1, padding: 0, maxWidth: 'none' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
