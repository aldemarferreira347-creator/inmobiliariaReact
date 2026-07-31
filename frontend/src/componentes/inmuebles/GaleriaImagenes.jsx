import { useState } from 'react';
import { urlArchivo } from '../../utilidades/urlArchivo';

export default function GaleriaImagenes({ imagenes }) {
  const [activa, setActiva] = useState(0);

  if (!imagenes || imagenes.length === 0) {
    return <div className="galeria-sin-imagenes">Sin imagenes disponibles</div>;
  }

  return (
    <div className="galeria-imagenes">
      <img className="galeria-principal" src={urlArchivo(imagenes[activa].rutaArchivo)} alt="" />
      <div className="galeria-miniaturas">
        {imagenes.map((img, indice) => (
          <img
            key={img._id}
            src={urlArchivo(img.rutaArchivo)}
            alt=""
            className={indice === activa ? 'activa' : ''}
            onClick={() => setActiva(indice)}
          />
        ))}
      </div>
    </div>
  );
}
