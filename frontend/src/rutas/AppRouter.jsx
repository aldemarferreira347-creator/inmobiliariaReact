import { Routes, Route } from 'react-router-dom';
import LayoutPublico from '../layouts/LayoutPublico';
import LayoutCliente from '../layouts/LayoutCliente';
import LayoutAsesor from '../layouts/LayoutAsesor';
import LayoutAdmin from '../layouts/LayoutAdmin';
import RutaPrivada from './RutaPrivada';
import RutaPorRol from './RutaPorRol';

import Home from '../paginas/publico/Home';
import Catalogo from '../paginas/publico/Catalogo';
import DetalleInmueble from '../paginas/publico/DetalleInmueble';
import Login from '../paginas/publico/Login';
import Registro from '../paginas/publico/Registro';
import RecuperarPassword from '../paginas/publico/RecuperarPassword';
import ResetPassword from '../paginas/publico/ResetPassword';
import ConfirmarCambioPassword from '../paginas/publico/ConfirmarCambioPassword';
import NoEncontrado from '../paginas/publico/NoEncontrado';

import Perfil from '../paginas/cliente/Perfil';
import Favoritos from '../paginas/cliente/Favoritos';
import AgendarCita from '../paginas/cliente/AgendarCita';
import MisCitas from '../paginas/cliente/MisCitas';
import MensajesCliente from '../paginas/cliente/Mensajes';
import Reservas from '../paginas/cliente/Reservas';
import ReservaDetalle from '../paginas/cliente/ReservaDetalle';
import TarjetasGuardadas from '../paginas/cliente/TarjetasGuardadas';
import MisArriendos from '../paginas/cliente/MisArriendos';
import MisCompras from '../paginas/cliente/MisCompras';
import NotificacionesCliente from '../paginas/cliente/NotificacionesCliente';

import PanelAsesor from '../paginas/asesor/PanelAsesor';
import CitasAsignadas from '../paginas/asesor/CitasAsignadas';
import CitaDetalleAsesor from '../paginas/asesor/CitaDetalleAsesor';
import MensajeriaAsesor from '../paginas/asesor/Mensajeria';
import VentasAsesor from '../paginas/asesor/VentasAsesor';
import VentaDetalleAsesor from '../paginas/asesor/VentaDetalleAsesor';

import PanelAdmin from '../paginas/administrador/PanelAdmin';
import UsuariosAdmin from '../paginas/administrador/UsuariosAdmin';
import PermisosAdmin from '../paginas/administrador/PermisosAdmin';
import InmueblesAdmin from '../paginas/administrador/InmueblesAdmin';
import CitasAdmin from '../paginas/administrador/CitasAdmin';
import FranjasAdmin from '../paginas/administrador/FranjasAdmin';
import MensajesAdmin from '../paginas/administrador/MensajesAdmin';
import AdminNotificaciones from '../paginas/administrador/AdminNotificaciones';
import ReservasAdmin from '../paginas/administrador/ReservasAdmin';
import ContratosAdmin from '../paginas/administrador/ContratosAdmin';
import VentasAdmin from '../paginas/administrador/VentasAdmin';
import ReportesAdmin from '../paginas/administrador/ReportesAdmin';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/inmuebles/:id" element={<DetalleInmueble />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/resetear-password/:token" element={<ResetPassword />} />
        <Route path="/confirmar-cambio-password/:token" element={<ConfirmarCambioPassword />} />
      </Route>

      <Route element={<RutaPrivada />}>
        <Route element={<LayoutCliente />}>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/citas/agendar/:inmuebleId" element={<AgendarCita />} />
          <Route path="/mis-citas" element={<MisCitas />} />
          <Route path="/mensajes" element={<MensajesCliente />} />
          <Route path="/reservas" element={<Reservas />} />
          <Route path="/reservas/:id" element={<ReservaDetalle />} />
          <Route path="/tarjetas" element={<TarjetasGuardadas />} />
          <Route path="/mis-arriendos" element={<MisArriendos />} />
          <Route path="/mis-compras" element={<MisCompras />} />
          <Route path="/notificaciones" element={<NotificacionesCliente />} />
        </Route>
      </Route>

      <Route element={<RutaPorRol rolesPermitidos={['asesor', 'administrador']} />}>
        <Route element={<LayoutAsesor />}>
          <Route path="/asesor" element={<PanelAsesor />} />
          <Route path="/asesor/citas" element={<CitasAsignadas />} />
          <Route path="/asesor/citas/:id" element={<CitaDetalleAsesor />} />
          <Route path="/asesor/mensajes" element={<MensajeriaAsesor />} />
          <Route path="/asesor/ventas" element={<VentasAsesor />} />
          <Route path="/asesor/ventas/:id" element={<VentaDetalleAsesor />} />
        </Route>
      </Route>

      <Route element={<RutaPorRol rolesPermitidos={['administrador']} />}>
        <Route element={<LayoutAdmin />}>
          <Route path="/administrador" element={<PanelAdmin />} />
          <Route path="/administrador/usuarios" element={<UsuariosAdmin />} />
          <Route path="/administrador/permisos" element={<PermisosAdmin />} />
          <Route path="/administrador/inmuebles" element={<InmueblesAdmin />} />
          <Route path="/administrador/citas" element={<CitasAdmin />} />
          <Route path="/administrador/franjas" element={<FranjasAdmin />} />
          <Route path="/administrador/mensajes" element={<MensajesAdmin />} />
          <Route path="/administrador/notificaciones" element={<AdminNotificaciones />} />
          <Route path="/administrador/reservas" element={<ReservasAdmin />} />
          <Route path="/administrador/contratos" element={<ContratosAdmin />} />
          <Route path="/administrador/ventas" element={<VentasAdmin />} />
          <Route path="/administrador/reportes" element={<ReportesAdmin />} />
        </Route>
      </Route>

      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}
