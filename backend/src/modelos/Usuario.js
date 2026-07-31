const mongoose = require('mongoose');
const { ROLES, TODOS_LOS_ROLES, ESTADOS_USUARIO } = require('../utilidades/constantes');

const perfilClienteSchema = new mongoose.Schema(
  {
    documentoTipo: { type: String, trim: true },
    documentoNumero: { type: String, trim: true },
    fechaNacimiento: { type: Date },
    // Un solo Customer de Stripe por cliente, reutilizado entre el SetupIntent (guardar tarjeta) y
    // los PaymentIntent (pagar con tarjeta guardada) - evita crear un Customer duplicado en Stripe.
    stripeCustomerId: { type: String, default: null },
  },
  { _id: false }
);

const perfilAsesorSchema = new mongoose.Schema(
  {
    especialidad: { type: String, trim: true },
    zona: { type: String, trim: true },
    // RN-14: un asesor con activoParaAsignacion=false no puede recibir nuevas citas asignadas.
    activoParaAsignacion: { type: Boolean, default: true },
  },
  { _id: false }
);

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 100 },
    apellido: { type: String, trim: true, maxlength: 100 },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo invalido'],
    },
    contrasenaHash: { type: String, required: true, select: false },
    rol: { type: String, enum: TODOS_LOS_ROLES, required: true, default: ROLES.CLIENTE, index: true },
    estado: { type: String, enum: Object.values(ESTADOS_USUARIO), default: ESTADOS_USUARIO.ACTIVO, index: true },
    telefono: { type: String, trim: true },
    direccion: { type: String, trim: true },
    ciudad: { type: String, trim: true },
    fotoPerfilUrl: { type: String, default: null },
    // Se incrementa al cambiar contrasena o forzar cierre de sesion global; el JWT lleva este valor.
    tokenVersion: { type: Number, default: 0 },
    ultimoAcceso: { type: Date, default: null },
    refreshTokenHash: { type: String, default: null, select: false },
    refreshTokenExpiraEn: { type: Date, default: null, select: false },
    perfilCliente: { type: perfilClienteSchema, default: undefined },
    perfilAsesor: { type: perfilAsesorSchema, default: undefined },
  },
  { timestamps: true }
);

usuarioSchema.index({ rol: 1, estado: 1 });

usuarioSchema.pre('validate', function asignarPerfilSegunRol() {
  if (this.rol === ROLES.CLIENTE && !this.perfilCliente) {
    this.perfilCliente = {};
  }
  if (this.rol === ROLES.ASESOR && !this.perfilAsesor) {
    this.perfilAsesor = { activoParaAsignacion: true };
  }
});

module.exports = mongoose.model('Usuario', usuarioSchema);
