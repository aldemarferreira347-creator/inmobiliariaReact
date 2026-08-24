class ApiError extends Error {
  constructor(statusCode, mensaje, detalles = null) {
    super(mensaje);
    this.statusCode = statusCode;
    this.detalles = detalles;
    this.esOperacional = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(mensaje, detalles) {
    return new ApiError(400, mensaje, detalles);
  }

  static noAutorizado(mensaje = 'No autorizado') {
    return new ApiError(401, mensaje);
  }

  static prohibido(mensaje = 'Acceso prohibido') {
    return new ApiError(403, mensaje);
  }

  static noEncontrado(mensaje = 'Recurso no encontrado') {
    return new ApiError(404, mensaje);
  }

  static conflicto(mensaje, detalles) {
    return new ApiError(409, mensaje, detalles);
  }

  static reglaDeNegocio(mensaje, detalles) {
    return new ApiError(422, mensaje, detalles);
  }

  static demasiadasPeticiones(mensaje = 'Demasiadas solicitudes, intenta de nuevo mas tarde') {
    return new ApiError(429, mensaje);
  }

  static interno(mensaje = 'Error interno del servidor') {
    return new ApiError(500, mensaje);
  }
}

module.exports = ApiError;
