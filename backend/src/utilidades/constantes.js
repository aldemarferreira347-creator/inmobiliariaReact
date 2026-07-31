const ROLES = Object.freeze({
  CLIENTE: 'cliente',
  ASESOR: 'asesor',
  ADMINISTRADOR: 'administrador',
});

const TODOS_LOS_ROLES = Object.values(ROLES);

const ESTADOS_USUARIO = Object.freeze({
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
});

module.exports = { ROLES, TODOS_LOS_ROLES, ESTADOS_USUARIO };
