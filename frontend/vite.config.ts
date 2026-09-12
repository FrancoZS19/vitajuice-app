import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Decisión técnica para el docente: Vite ofrece arranque instantáneo y Hot Module Replacement (HMR) ultrarrápido
// con servidor de desarrollo en el puerto 5173.
export default defineConfig({
  plugins: [react()],
  base: '/vitajuice-app/',
  server: {
    port: 5173,
  },
});
