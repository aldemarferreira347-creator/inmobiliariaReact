const fs = require('fs/promises');
const path = require('path');
const ApiError = require('../utilidades/ApiError');

const TIPOS_IMAGEN_PERMITIDOS = new Set(['image/jpeg', 'image/png']);
const TAMANO_MAX_FOTO_PERFIL = 2 * 1024 * 1024; // 2MB, igual que HU-25
const TAMANO_MAX_IMAGEN_INMUEBLE = 5 * 1024 * 1024; // 5MB, igual que HU-08
const TAMANO_MAX_PDF = 5 * 1024 * 1024; // 5MB, igual que ContratoService/VentaService del PHP original

async function validarImagenReal(buffer, tiposPermitidos) {
  const { fileTypeFromBuffer } = await import('file-type');
  const tipo = await fileTypeFromBuffer(buffer);

  if (!tipo || !tiposPermitidos.has(tipo.mime)) {
    throw ApiError.badRequest('El archivo no es una imagen valida (se valida el contenido real, no la extension)');
  }

  return tipo;
}

async function guardarFotoPerfil(archivo, usuarioId) {
  if (!archivo) {
    throw ApiError.badRequest('No se recibio ningun archivo');
  }
  if (archivo.size > TAMANO_MAX_FOTO_PERFIL) {
    throw ApiError.badRequest('La imagen supera el tamano maximo de 2MB');
  }

  const tipo = await validarImagenReal(archivo.buffer, TIPOS_IMAGEN_PERMITIDOS);

  const nombreArchivo = `perfil_${usuarioId}_${Date.now()}.${tipo.ext}`;
  const rutaDestino = path.join('uploads', 'perfiles', nombreArchivo);

  await fs.mkdir(path.join('uploads', 'perfiles'), { recursive: true });
  await fs.writeFile(rutaDestino, archivo.buffer);

  return `/uploads/perfiles/${nombreArchivo}`;
}

async function guardarImagenInmueble(archivo, inmuebleId) {
  if (!archivo) {
    throw ApiError.badRequest('No se recibio ningun archivo');
  }
  if (archivo.size > TAMANO_MAX_IMAGEN_INMUEBLE) {
    throw ApiError.badRequest('La imagen supera el tamano maximo de 5MB');
  }

  const tipo = await validarImagenReal(archivo.buffer, TIPOS_IMAGEN_PERMITIDOS);

  const nombreArchivo = `inmueble_${inmuebleId}_${Date.now()}_${Math.round(Math.random() * 1e6)}.${tipo.ext}`;
  const rutaDestino = path.join('uploads', 'inmuebles', nombreArchivo);

  await fs.mkdir(path.join('uploads', 'inmuebles'), { recursive: true });
  await fs.writeFile(rutaDestino, archivo.buffer);

  return { rutaPublica: `/uploads/inmuebles/${nombreArchivo}`, mimeType: tipo.mime, tamanoBytes: archivo.size };
}

async function eliminarArchivoSiExiste(rutaPublica) {
  if (!rutaPublica || !rutaPublica.startsWith('/uploads/')) return;
  const rutaFisica = path.join('.', rutaPublica);
  try {
    await fs.unlink(rutaFisica);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

// Contratos y escrituras son documentos legales/sensibles - a diferencia de las imagenes de
// inmuebles o fotos de perfil, se guardan en storage/ (fuera de uploads/, que se sirve publico via
// express.static) y solo se exponen mediante una ruta autenticada con verificacion de propiedad
// (ver contratoServicio.descargarPdf) - igual que ContratoDescargaController del PHP original.
async function validarPdfReal(buffer) {
  const { fileTypeFromBuffer } = await import('file-type');
  const tipo = await fileTypeFromBuffer(buffer);

  if (!tipo || tipo.mime !== 'application/pdf') {
    throw ApiError.badRequest('El archivo no es un PDF valido (se valida el contenido real, no la extension)');
  }

  return tipo;
}

async function guardarPdfPrivado(archivo, carpeta, prefijo, entidadId) {
  if (!archivo) {
    throw ApiError.badRequest('No se recibio ningun archivo');
  }
  if (archivo.size > TAMANO_MAX_PDF) {
    throw ApiError.badRequest('El archivo supera el tamano maximo de 5MB');
  }

  await validarPdfReal(archivo.buffer);

  const nombreArchivo = `${prefijo}_${entidadId}_${Date.now()}.pdf`;
  const rutaRelativa = `storage/${carpeta}/${nombreArchivo}`;

  await fs.mkdir(path.join('storage', carpeta), { recursive: true });
  await fs.writeFile(rutaRelativa, archivo.buffer);

  return rutaRelativa;
}

async function guardarContratoPdf(archivo, contratoId) {
  return guardarPdfPrivado(archivo, 'contratos', 'contrato', contratoId);
}

async function guardarEscrituraPdf(archivo, ventaId) {
  return guardarPdfPrivado(archivo, 'escrituras', 'escritura', ventaId);
}

module.exports = {
  validarImagenReal,
  guardarFotoPerfil,
  guardarImagenInmueble,
  eliminarArchivoSiExiste,
  guardarContratoPdf,
  guardarEscrituraPdf,
  TIPOS_IMAGEN_PERMITIDOS,
  TAMANO_MAX_FOTO_PERFIL,
  TAMANO_MAX_IMAGEN_INMUEBLE,
  TAMANO_MAX_PDF,
};
