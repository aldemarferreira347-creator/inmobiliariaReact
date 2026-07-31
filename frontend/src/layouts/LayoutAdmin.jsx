import { Outlet } from 'react-router-dom';
import BarraNavegacion from '../componentes/comunes/BarraNavegacion';
import SidebarAdmin from '../componentes/comunes/SidebarAdmin';

const ENLACES_NAV = [
  { to: '/',        texto: 'Inicio' },
  { to: '/catalogo',texto: 'Inmuebles' },
];

export default function LayoutAdmin() {
  return (
    <div className="layout-admin">
      <BarraNavegacion enlaces={ENLACES_NAV} />
      <div className="panel-layout">
        <SidebarAdmin />
        <main className="panel-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
