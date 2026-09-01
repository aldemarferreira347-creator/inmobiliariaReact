const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const opcionesCors = require('./configuracion/cors');
const { limitadorGeneral } = require('./middlewares/limitadorPeticiones');
const { rutaNoEncontrada, manejoErrores } = require('./middlewares/manejoErrores');
const rutas = require('./rutas');
const webhooksRutas = require('./rutas/webhooks.rutas');

const app = express();

app.set('trust proxy', false);

// crossOriginResourcePolicy en 'cross-origin' porque las imagenes de /uploads se consumen desde
// el frontend en un origen distinto (puerto 3000 vs 4000); el resto de protecciones de helmet
// se mantienen, y el acceso a la API en si sigue restringido por la configuracion de CORS.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(opcionesCors));
app.use(cookieParser());

// El webhook de Stripe necesita el body crudo (Buffer) para verificar la firma
// (stripe.webhooks.constructEvent) - se monta antes de express.json() para que ese middleware
// global no lo parsee primero como JSON.
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhooksRutas);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limitadorGeneral);

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.json({ exito: true, mensaje: 'API de Inmobiliaria en funcionamiento' });
});

app.use('/api', rutas);

app.use(rutaNoEncontrada);
app.use(manejoErrores);

module.exports = app;
