import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexto/AuthContext';
import AppRouter from './rutas/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
