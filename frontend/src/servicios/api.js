import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refrescando = null;

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const peticionOriginal = error.config;
    const esLoginORefresh = peticionOriginal?.url?.includes('/auth/login') || peticionOriginal?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !peticionOriginal._reintentado && !esLoginORefresh) {
      peticionOriginal._reintentado = true;
      try {
        refrescando = refrescando || api.post('/auth/refresh');
        await refrescando;
        refrescando = null;
        return api(peticionOriginal);
      } catch (errorRefresh) {
        refrescando = null;
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
