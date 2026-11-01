import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages needs its repository path; Capacitor needs relative asset paths.
const base = process.env.BUILD_TARGET === 'ios' ? './' : '/Ativus-/';

export default defineConfig({
  plugins: [react()],
  base,
});
