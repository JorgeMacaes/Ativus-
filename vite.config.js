import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages needs its repository path; native Capacitor apps need relative asset paths.
const isNative = ['ios', 'android'].includes(process.env.BUILD_TARGET);
const base = isNative ? './' : '/Ativus-/';

export default defineConfig({
  plugins: [react()],
  base,
});
