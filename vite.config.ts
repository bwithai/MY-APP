import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['firefox 52'],
      polyfills: [
        'es.promise',
        'es.array.iterator',
        'es.object.assign',
        'es.symbol',
        'es.string.includes',
        'es.array.includes',
        'es.array.find',
        'es.array.from',
        'es.function.bind',
        'es.object.keys',
        'web.dom-collections.for-each'
      ],
      modernPolyfills: true,
      renderLegacyChunks: true
    }),
  ],
  build: {
    target: 'firefox52',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: '/index.html',
        login: '/login.html'
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        inlineDynamicImports: false
      }
    }
  },
  base: '/',
  optimizeDeps: {
    include: ['es6-promise/auto']
  },
  define: {
    '%VITE_API_URL%': JSON.stringify(process.env.VITE_API_URL)
  }
});
