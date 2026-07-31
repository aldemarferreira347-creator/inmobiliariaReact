const { ROLES } = require('../utilidades/constantes');

// Matriz de permisos: catalogo informativo (igual que la tabla `permiso` del PHP original), no
// se usa para autorizacion dinamica real -- la autorizacion efectiva es por rol via middlewares.
const MODULOS = [
  'inmuebles',
  'reservas',
  'citas',
  'contratos',
  'ventas',
  'mensajes',
  'notificaciones',
  'reportes',
  'usuarios',
];

const ACCIONES = ['create', 'read', 'update', 'delete'];

const MATRIZ = {
  [ROLES.CLIENTE]: { inmuebles: ['read'], reservas: ['create', 'read'], citas: ['create', 'read'], contratos: ['read'], mensajes: ['create', 'read'], notificaciones: ['read'] },
  [ROLES.ASESOR]: { inmuebles: ['read'], citas: ['read', 'update'], mensajes: ['create', 'read'], ventas: ['create', 'read', 'update'], notificaciones: ['read'] },
  [ROLES.ADMINISTRADOR]: MODULOS.reduce((acc, modulo) => ({ ...acc, [modulo]: ACCIONES }), {}),
};

function construirPermisos() {
  const permisos = [];
  for (const modulo of MODULOS) {
    for (const accion of ACCIONES) {
      const rolesAsociados = Object.entries(MATRIZ)
        .filter(([, acciones]) => acciones[modulo]?.includes(accion))
        .map(([rol]) => rol);

      if (rolesAsociados.length === 0) continue;

      permisos.push({
        codigo: `${modulo}.${accion}`,
        modulo,
        accion,
        descripcion: `Permiso para ${accion} sobre ${modulo}`,
        rolesAsociados,
        activo: true,
      });
    }
  }
  return permisos;
}

async function sembrarPermisos(Permiso) {
  const permisos = construirPermisos();
  for (const permiso of permisos) {
    await Permiso.updateOne({ codigo: permiso.codigo }, { $set: permiso }, { upsert: true });
  }
  return permisos.length;
}

module.exports = sembrarPermisos;
