import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;
const htmlDir = resolve(root, 'www/html');

const appPages = Object.fromEntries(
  readdirSync(htmlDir)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [`app-${basename(file, '.html')}`, resolve(htmlDir, file)])
);
const appPageFiles = new Set(Object.values(appPages).map((file) => basename(file)));

function viteRouteAliases() {
  const rewrite = (req) => {
    if (!req.url) return;
    const url = new URL(req.url, 'http://wenshu.local');
    if (url.pathname === '/') {
      req.url = `/www/html/index.html${url.search}`;
      return;
    }
    if (url.pathname === '/landing' || url.pathname === '/landing/') {
      req.url = `/landing/index.html${url.search}`;
      return;
    }
    const shortPage = url.pathname.match(/^\/([^/]+\.html)$/)?.[1];
    if (shortPage && appPageFiles.has(shortPage)) {
      req.url = `/www/html/${shortPage}${url.search}`;
    }
  };

  return {
    name: 'wenshu-route-aliases',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  base: './',
  plugins: [viteRouteAliases()],
  server: {
    host: '0.0.0.0',
    open: '/www/html/index.html',
    watch: {
      ignored: ['**/dist/**', '**/platforms/**', '**/plugins/**', '**/landing/www/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        landing: resolve(root, 'landing/index.html'),
        ...appPages,
      },
      output: {
        entryFileNames: 'www/assets/[name]-[hash].js',
        chunkFileNames: 'www/assets/[name]-[hash].js',
        assetFileNames: 'www/assets/[name]-[hash][extname]',
      },
    },
  },
});
