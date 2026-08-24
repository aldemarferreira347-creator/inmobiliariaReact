const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema(
  {
    // Un hilo por cada par (cliente, miembro del staff): "<clienteId>_<staffId>".
    hiloId: { type: String, required: true, index: true },
    remitente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    destinatario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    // Inmueble sobre el que se consulta (solo cuando el mensaje nace del formulario de contacto
    // de una ficha de inmueble); null en el resto de la mensajeria general.
    inmueble: { type: mongoose.Schema.Types.ObjectId, ref: 'Inmueble', default: null },
    contenido: { type: String, trim: true },
    // Se preserva el enfoque del PHP original (adjunto codificado inline) para no romper paridad
    // funcional; es una imagen pequena en base64, ya limitada por express.json({limit:'2mb'}).
    adjuntoBase64: { type: String, default: null },
    leido: { type: Boolean, default: false, index: true },
    fechaEnvio: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

mensajeSchema.index({ hiloId: 1, fechaEnvio: 1 });
mensajeSchema.index({ destinatario: 1, leido: 1 });

module.exports = mongoose.model('Mensaje', mensajeSchema);
