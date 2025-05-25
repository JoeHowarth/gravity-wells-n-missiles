import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/gravity-wells-n-missiles/', // This will be your GitHub repo name
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
});