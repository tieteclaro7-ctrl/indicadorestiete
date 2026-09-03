import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerPWA } from './pwaRegistration';

// Registra o Service Worker para suporte a PWA (PC, Android, iPhone)
registerPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

