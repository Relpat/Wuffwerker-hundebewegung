import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// GitHub Pages serves project sites below /<repository>/.
// Local development keeps the root path.
// Two pages: the motion study (index) and the pose generator (posen, stage G4).
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true'
    ? '/Wuffwerker-hundebewegung/'
    : '/',
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        posen: resolve(import.meta.dirname, 'posen.html'),
      },
    },
  },
});
