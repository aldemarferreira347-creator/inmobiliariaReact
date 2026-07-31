const Favorito = require('../modelos/Favorito');
const Inmueble = require('../modelos/Inmueble');
const ApiError = require('../utilidades/ApiError');

async function alternar(clienteId, inmuebleId) {
  const existente = await Favorito.findOne({ cliente: clienteId, inmueble: inmuebleId });

  if (existente) {
    await existente.deleteOne();
    return { esFavorito: false };
  }

  const inmueble = await Inmueble.findById(inmuebleId);
  if (!inmueble) throw ApiError.noEncontrado('Inmueble no encontrado');

  await Favorito.create({ cliente: clienteId, inmueble: inmuebleId });
  return { esFavorito: true };
}

async function listarPorCliente(clienteId) {
  const favoritos = await Favorito.find({ cliente: clienteId }).populate('inmueble');
  return favoritos.filter((f) => f.inmueble).map((f) => f.inmueble);
}

module.exports = { alternar, listarPorCliente };
