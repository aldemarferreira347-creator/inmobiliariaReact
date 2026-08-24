const nodemailer = require('nodemailer');
const entorno = require('../configuracion/entorno');
const logger = require('../utilidades/logger');

function crearTransportador() {
  if (!entorno.smtp.host) {
    // Sin SMTP configurado: se registra el correo en el log en vez de enviarlo (modo desarrollo),
    // equivalente al fallback a mail() nativo del PHP original pero sin depender de un MTA local.
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: entorno.smtp.host,
    port: entorno.smtp.port,
    secure: entorno.smtp.secure,
    auth: entorno.smtp.user ? { user: entorno.smtp.user, pass: entorno.smtp.pass } : undefined,
  });
}

const transportador = crearTransportador();

async function enviarCorreo({ para, asunto, html }) {
  const info = await transportador.sendMail({
    from: `"${entorno.smtp.fromName}" <${entorno.smtp.fromEmail}>`,
    to: para,
    subject: asunto,
    html,
  });

  if (!entorno.smtp.host) {
    logger.info(`Correo simulado (sin SMTP configurado) para ${para}: ${asunto}`);
  }

  return info;
}

function plantillaBase(titulo, cuerpoHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color:#1a2b4c;">${titulo}</h2>
      ${cuerpoHtml}
      <p style="color:#888; font-size:12px; margin-top:24px;">Garcia Inmobiliaria</p>
    </div>
  `;
}

async function enviarConfirmacionRegistro(usuario) {
  return enviarCorreo({
    para: usuario.correo,
    asunto: 'Bienvenido a Garcia Inmobiliaria',
    html: plantillaBase(
      'Registro exitoso',
      `<p>Hola ${usuario.nombre}, tu cuenta fue creada correctamente.</p>`
    ),
  });
}

async function enviarEnlaceRecuperacion(usuario, tokenPlano) {
  const enlace = `${entorno.urlFrontend}/resetear-password/${tokenPlano}`;
  return enviarCorreo({
    para: usuario.correo,
    asunto: 'Recupera tu contrasena',
    html: plantillaBase(
      'Recuperacion de contrasena',
      `<p>Hola ${usuario.nombre}, haz clic en el siguiente enlace para restablecer tu contrasena. Expira en 60 minutos.</p>
       <p><a href="${enlace}">${enlace}</a></p>`
    ),
  });
}

async function enviarConfirmacionSolicitudCambioPassword(usuario, tokenPlano) {
  const enlace = `${entorno.urlFrontend}/confirmar-cambio-password/${tokenPlano}`;
  return enviarCorreo({
    para: usuario.correo,
    asunto: 'Confirma tu cambio de contrasena',
    html: plantillaBase(
      'Confirmacion requerida',
      `<p>Hola ${usuario.nombre}, solicitaste cambiar tu contrasena. Haz clic en el siguiente enlace para
       confirmar el cambio. Expira en 15 minutos. Si no fuiste tu, ignora este correo.</p>
       <p><a href="${enlace}">${enlace}</a></p>`
    ),
  });
}

async function enviarConfirmacionCambioPassword(usuario) {
  return enviarCorreo({
    para: usuario.correo,
    asunto: 'Tu contrasena fue cambiada',
    html: plantillaBase(
      'Contrasena actualizada',
      `<p>Hola ${usuario.nombre}, tu contrasena fue cambiada exitosamente. Si no fuiste tu, contacta a soporte de inmediato.</p>`
    ),
  });
}

async function enviarComprobantePago(usuario, reserva) {
  return enviarCorreo({
    para: usuario.correo,
    asunto: `Comprobante de pago - Reserva ${reserva.codigo}`,
    html: plantillaBase(
      'Pago recibido',
      `<p>Hola ${usuario.nombre}, confirmamos el pago de tu reserva <strong>${reserva.codigo}</strong> por
       $${reserva.monto.toLocaleString('es-CO')}.</p>`
    ),
  });
}

module.exports = {
  enviarCorreo,
  enviarConfirmacionRegistro,
  enviarEnlaceRecuperacion,
  enviarConfirmacionSolicitudCambioPassword,
  enviarConfirmacionCambioPassword,
  enviarComprobantePago,
};
