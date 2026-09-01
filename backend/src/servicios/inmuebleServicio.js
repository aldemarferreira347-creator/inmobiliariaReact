const mongoose = require('mongoose');
const Inmueble = require('../modelos/Inmueble');
const ImagenInmueble = require('../modelos/ImagenInmueble');
const Favorito = require('../modelos/Favorito');
const Reserva = require('../modelos/Reserva');
const Contrato = require('../modelos/Contrato');
const ApiError = require('../utilidades/ApiError');
const almacenamientoServicio = require('./almacenamientoServicio');

async function generarCodigoUnico() {
  let codigo;
  let existe = true;
  do {
    codigo = `INM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    existe = await Inmueble.exists({ codigo });
  } while (existe);
  return codigo;
}

function construirFiltro(query) {
  const filtro = {};

  if (query.tipo) filtro.tipo = query.tipo;
  if (query.modalidad) filtro.modalidad = query.modalidad;
  
  const ubicacionTexto = query.ciudad || query.ubicacion;
  if (ubicacionTexto) {
    filtro.$or = [
      { 'ubicacion.ciudad': new RegExp(ubicacionTexto.trim(), 'i') },
      { 'ubicacion.barrio': new RegExp(ubicacionTexto.trim(), 'i') },
      { 'ubicacion.direccion': new RegExp(ubicacionTexto.trim(), 'i') },
    ];
  } else if (query.barrio) {
    filtro['ubicacion.barrio'] = new RegExp(query.barrio.trim(), 'i');
  }

  if (query.habitaciones) filtro.habitaciones = { $gte: Number(query.habitaciones) };
  if (query.estado) filtro.estado = query.estado;

  const precioMinimo = query.precioMin ?? query.precio_min;
  const precioMaximo = query.precioMax ?? query.precio_max;

  if (precioMinimo || precioMaximo) {
    filtro.precio = {};
    if (precioMinimo) filtro.precio.$gte = Number(precioMinimo);
    if (precioMaximo) filtro.precio.$lte = Number(precioMaximo);
  }

  if (query.codigo) {
    filtro.codigo = new RegExp(query.codigo.trim(), 'i');
  }

  return filtro;
}

async function filtrar(query) {
  const filtro = construirFiltro(query);
  const pagina = Math.max(1, Number(query.pagina) || 1);
  const limite = Math.min(50, Number(query.limite) || 12);

  const [inmuebles, total] = await Promise.all([
    Inmueble.find(filtro)
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite),
    Inmueble.countDocuments(filtro),
  ]);

  const idsInmuebles = inmuebles.map((i) => i._id);
  const imagenesPrincipales = await ImagenInmueble.find({ inmueble: { $in: idsInmuebles }, esPrincipal: true });
  const mapaImagenes = new Map(imagenesPrincipales.map((img) => [String(img.inmueble), img.rutaArchivo]));

  return {
    inmuebles: inmuebles.map((i) => ({ ...i.toObject(), imagenPrincipal: mapaImagenes.get(String(i._id)) || null })),
    total,
    pagina,
    totalPaginas: Math.ceil(total / limite) || 1,
  };
}

async function obtenerDestacados(limite = 6) {
  const inmuebles = await Inmueble.find({ estado: 'Disponible', destacado: true }).limit(limite);
  return inmuebles;
}

async function obtenerDetalle(id) {
  const inmueble = await Inmueble.findById(id);
  if (!inmueble) throw ApiError.noEncontrado('Inmueble no encontrado');

  const imagenes = await ImagenInmueble.find({ inmueble: id }).sort({ esPrincipal: -1, orden: 1 });

  return { inmueble, imagenes };
}

async function obtenerEstadoActual(id) {
  const inmueble = await Inmueble.findById(id).select('estado');
  if (!inmueble) throw ApiError.noEncontrado('Inmueble no encontrado');
  return inmueble.estado;
}

async function crear(datos, usuarioId) {
  const codigo = await generarCodigoUnico();
  const inmueble = await Inmueble.create({ ...datos, codigo, creadoPor: usuarioId });
  return inmueble;
}

async function actualizar(id, datos) {
  const inmueble = await Inmueble.findById(id);
  if (!inmueble) throw ApiError.noEncontrado('Inmueble no encontrado');

  Object.assign(inmueble, datos);
  await inmueble.save();

  return inmueble;
}

async function tieneReservaOContratoActivo(inmuebleId) {
  const activa = await Reserva.exists({
    inmueble: inmuebleId,
    estado: { $in: ['PENDIENTE_PAGO', 'PROCESANDO_PAGO', 'CONFIRMADA'] },
    eliminado: false,
  });
  if (activa) return true;

  const vigente = await Contrato.exists({ inmueble: inmuebleId, estado: 'Vigente' });
  if (vigente) return true;

  return false;
}

async function eliminar(id) {
  const inmueble = await Inmueble.findById(id);
  if (!inmueble) throw ApiError.noEncontrado('Inmueble no encontrado');

  if (await tieneReservaOContratoActivo(id)) {
    throw ApiError.conflicto('No se puede eliminar un inmueble con reservas o contratos activos');
  }

  const imagenes = await ImagenInmueble.find({ inmueble: id });
  await Promise.all(imagenes.map((img) => almacenamientoServicio.eliminarArchivoSiExiste(img.rutaArchivo)));
  await ImagenInmueble.deleteMany({ inmueble: id });
  await Favorito.deleteMany({ inmueble: id });
  await inmueble.deleteOne();
}

async function agregarImagen(inmuebleId, archivo) {
  const inmueble = await Inmueble.findById(inmuebleId);
  if (!inmueble) throw ApiError.noEncontrado('Inmueble no encontrado');

  const { rutaPublica, mimeType, tamanoBytes } = await almacenamientoServicio.guardarImagenInmueble(archivo, inmuebleId);

  const esPrimera = !(await ImagenInmueble.exists({ inmueble: inmuebleId }));

  const imagen = await ImagenInmueble.create({
    inmueble: inmuebleId,
    rutaArchivo: rutaPublica,
    esPrincipal: esPrimera,
    mimeType,
    tamanoBytes,
  });

  return imagen;
}

async function establecerPrincipal(inmuebleId, imagenId) {
  await ImagenInmueble.updateMany({ inmueble: inmuebleId }, { esPrincipal: false });
  const imagen = await ImagenInmueble.findOneAndUpdate(
    { _id: imagenId, inmueble: inmuebleId },
    { esPrincipal: true },
    { new: true }
  );
  if (!imagen) throw ApiError.noEncontrado('Imagen no encontrada');
  return imagen;
}

async function eliminarImagen(inmuebleId, imagenId) {
  const imagen = await ImagenInmueble.findOne({ _id: imagenId, inmueble: inmuebleId });
  if (!imagen) throw ApiError.noEncontrado('Imagen no encontrada');

  await almacenamientoServicio.eliminarArchivoSiExiste(imagen.rutaArchivo);
  await imagen.deleteOne();

  if (imagen.esPrincipal) {
    const siguiente = await ImagenInmueble.findOne({ inmueble: inmuebleId }).sort({ orden: 1 });
    if (siguiente) {
      siguiente.esPrincipal = true;
      await siguiente.save();
    }
  }
}

module.exports = {
  filtrar,
  obtenerDestacados,
  obtenerDetalle,
  obtenerEstadoActual,
  crear,
  actualizar,
  eliminar,
  agregarImagen,
  establecerPrincipal,
  eliminarImagen,
};
