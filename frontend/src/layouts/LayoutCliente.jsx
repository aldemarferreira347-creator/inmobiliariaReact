import { Outlet } from 'react-router-dom';
import BarraNavegacion from '../componentes/comunes/BarraNavegacion';
import Footer from '../componentes/comunes/Footer';
import SidebarCliente from '../componentes/comunes/SidebarCliente';

export default function LayoutCliente() {
  return (
    <div className="layout-cliente">
      <BarraNavegacion />
      <div className="container" style={{ margin: '2rem auto' }}>
        <div className="perfil-dashboard" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <SidebarCliente />
          <main className="perfil-content" style={{ flex: 1, minWidth: 0 }}>
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
