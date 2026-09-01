import { useEffect, useState } from 'react';
import { useAuth } from '../../contexto/AuthContext';
import * as mensajesServicio from '../../servicios/mensajes.servicio';
import usePolling from '../../hooks/usePolling';

function nombreCompleto(persona) {
  if (!persona) return 'Desconocido';
  return `${persona.nombre} ${persona.apellido}`;
}

export default function Mensajeria({ titulo }) {
  const { usuario } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [mensajesHilo, setMensajesHilo] = useState([]);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');

  const cargarConversaciones = async () => {
    const data = await mensajesServicio.conversaciones();
    setConversaciones(data.conversaciones);
  };

  useEffect(() => {
    cargarConversaciones();
  }, []);

  const otroParaMi = (conv) => (usuario.rol === 'cliente' ? conv.staff : conv.cliente);
  const puedoResponder = (conv) => usuario.rol === 'cliente' || String(conv.staff?._id) === String(usuario._id);

  const paramsParaAdmin = (conv) => (usuario?.rol === 'administrador' && conv?.staff?._id ? { staffId: conv.staff._id } : {});

  const abrirConversacion = async (conv) => {
    setSeleccion(conv);
    setError('');
    try {
      const otroId = otroParaMi(conv)?._id;
      const data = await mensajesServicio.hilo(otroId, paramsParaAdmin(conv));
      setMensajesHilo(data.mensajes);
      if (usuario.rol !== 'administrador') {
        await mensajesServicio.marcarLeidos(otroId);
      }
      await cargarConversaciones();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo abrir la conversación.');
    }
  };

  usePolling(async () => {
    if (!seleccion) return;
    const otroId = otroParaMi(seleccion)?._id;
    const desde = mensajesHilo.length > 0 ? mensajesHilo[mensajesHilo.length - 1].fechaEnvio : new Date(0).toISOString();
    const data = await mensajesServicio.nuevosDesde(otroId, desde, paramsParaAdmin(seleccion));
    if (data.mensajes.length > 0) {
      setMensajesHilo((prev) => [...prev, ...data.mensajes]);
    }
  }, 10000);

  const enviar = async () => {
    if (!texto.trim() || !seleccion) return;
    setError('');
    try {
      const otroId = otroParaMi(seleccion)?._id;
      await mensajesServicio.enviar(otroId, texto.trim());
      setTexto('');
      const data = await mensajesServicio.hilo(otroId, paramsParaAdmin(seleccion));
      setMensajesHilo(data.mensajes);
    } catch (e) {
      setError(e.response?.data?.mensaje || 'No se pudo enviar el mensaje.');
    }
  };

  return (
    <div>
      <h1>{titulo}</h1>
      {error && <p className="error-general">{error}</p>}
      <div className="mensajeria">
        <div className="lista-conversaciones">
          {conversaciones.length === 0 ? (
            <p>No tienes conversaciones todavia.</p>
          ) : (
            conversaciones.map((conv) => (
              <button
                type="button"
                key={conv.hiloId}
                className={seleccion?.hiloId === conv.hiloId ? 'conversacion activa' : 'conversacion'}
                onClick={() => abrirConversacion(conv)}
              >
                <strong>
                  {usuario.rol === 'administrador'
                    ? `${nombreCompleto(conv.cliente)} <-> ${nombreCompleto(conv.staff)}`
                    : nombreCompleto(otroParaMi(conv))}
                </strong>
                {conv.noLeidos > 0 && <span className="badge-no-leidas">{conv.noLeidos}</span>}
                <p>{conv.ultimoMensaje.contenido}</p>
              </button>
            ))
          )}
        </div>

        <div className="hilo-mensajes">
          {!seleccion ? (
            <p>Selecciona una conversacion.</p>
          ) : (
            <>
              <div className="mensajes-lista">
                {mensajesHilo.map((m) => (
                  <div key={m._id} className={String(m.remitente) === String(usuario._id) ? 'mensaje propio' : 'mensaje'}>
                    <p>{m.contenido}</p>
                  </div>
                ))}
              </div>
              {puedoResponder(seleccion) && (
                <div className="caja-respuesta">
                  <textarea rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} />
                  <button type="button" onClick={enviar} disabled={!texto.trim()}>Enviar</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
