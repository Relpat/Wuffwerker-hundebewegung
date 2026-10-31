import { defineConfig } from 'vite';

// GitHub Pages serves project sites below /<repository>/.
// Local development keeps the root path.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true'
    ? '/Wuffwerker-hundebewegung/'
    : '/',
});
