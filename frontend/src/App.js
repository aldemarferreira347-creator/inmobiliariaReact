import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexto/AuthContext';
import { ToastProvider } from './contexto/ToastContext';
import AppRouter from './rutas/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
