import { Outlet } from 'react-router-dom';
import BarraNavegacion from '../componentes/comunes/BarraNavegacion';
import SidebarAsesor from '../componentes/comunes/SidebarAsesor';

const ENLACES_NAV = [
  { to: '/',        texto: 'Inicio' },
  { to: '/catalogo',texto: 'Inmuebles' },
];

export default function LayoutAsesor() {
  return (
    <div className="layout-asesor">
      <BarraNavegacion enlaces={ENLACES_NAV} />
      <div className="panel-layout">
        <SidebarAsesor />
        <main className="panel-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
