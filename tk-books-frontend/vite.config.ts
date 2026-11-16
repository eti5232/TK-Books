import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// בפיתוח: קריאות /api ו-/files עוברות לשרת (פורט 3000), כך שאין בעיות CORS
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/files': 'http://localhost:3000',
      '/openapi.json': 'http://localhost:3000',
    },
  },
});
