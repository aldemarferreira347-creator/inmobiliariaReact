const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const ORIGEN_BACKEND = API_URL.replace(/\/api\/?$/, '');

export function urlArchivo(rutaRelativa) {
  if (!rutaRelativa) return null;
  if (rutaRelativa.startsWith('http')) return rutaRelativa;
  return `${ORIGEN_BACKEND}${rutaRelativa}`;
}
