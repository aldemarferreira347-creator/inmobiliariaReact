require('dotenv').config();

function requerido(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno obligatoria: ${nombre}`);
  }
  return valor;
}

const entorno = {
  nodeEnv: process.env.NODE_ENV || 'development',
  esProduccion: process.env.NODE_ENV === 'production',
  puerto: Number(process.env.PORT) || 4000,
  urlFrontend: process.env.FRONTEND_URL || 'http://localhost:3000',

  mongoUri: requerido('MONGODB_URI'),

  jwt: {
    secretoAcceso: requerido('JWT_ACCESS_SECRET'),
    secretoRefresco: requerido('JWT_REFRESH_SECRET'),
    expiracionAcceso: process.env.JWT_ACCESS_EXPIRES || '15m',
    expiracionRefresco: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  proxyConfiable: process.env.TRUSTED_PROXY || '',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'no-responder@garciainmobiliaria.com',
    fromName: process.env.SMTP_FROM_NAME || 'Garcia Inmobiliaria',
  },
};

module.exports = entorno;
