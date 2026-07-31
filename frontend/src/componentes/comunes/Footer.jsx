import { Building2, Home, Key, DollarSign, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer>
      <div className="container">
        <div className="footer-content">

          {/* Marca */}
          <div className="footer-brand">
            <Link to="/" className="logo">
              <span className="logo-badge">
                <Building2 className="h-5 w-5" />
              </span>
              García Inmobiliaria
            </Link>
            <p>
              Tu aliado de confianza para comprar, vender y arrendar
              propiedades en Neiva, Huila. Más de 5 años de experiencia
              acompañando familias y empresas.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <h4>Servicios</h4>
            <ul className="footer-links">
              <li><Home className="h-4 w-4" /> Compra de inmuebles</li>
              <li><DollarSign className="h-4 w-4" /> Venta de propiedades</li>
              <li><Key className="h-4 w-4" /> Arriendo residencial</li>
              <li><Building2 className="h-4 w-4" /> Locales comerciales</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="#top">Términos de uso</a></li>
              <li><a href="#top">Política de privacidad</a></li>
              <li><a href="#top">Tratamiento de datos</a></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4>Contáctanos</h4>
            <ul className="footer-links">
              <li><MapPin className="h-4 w-4" /> Av. Principal #15-78, Neiva</li>
              <li>
                <a href="tel:+573138161568">
                  <Phone className="h-4 w-4" /> 313 816 1568
                </a>
              </li>
              <li>
                <a href="#top" aria-label="Facebook">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#top" aria-label="Instagram">
                  Instagram
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          © {anio} García Inmobiliaria · Todos los derechos reservados · Neiva, Huila
        </div>
      </div>
    </footer>
  );
}
