import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page heading', () => {
  render(<App />);
  const titulo = screen.getByRole('heading', { name: /Garcia Inmobiliaria/i });
  expect(titulo).toBeInTheDocument();
});
