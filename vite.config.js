import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      command === 'build' &&
        legacy({
          targets: ['Firefox >= 52', 'firefox 60'],
          modernPolyfills: [
            'es/array',
            'es/object',
            'es/string',
            'es/global-this',
          ],
          renderLegacyChunks: false,
          polyfills: [
            'es/array/iterator',
            'es/map',
            'es/set',
            'es/object/assign',
            'es/object/entries',
            'es/object/values',
            'es/string/includes',
            'es/string/starts-with',
            'es/string/ends-with',
          ],
        }),
    ],
    build: {
      target: ['es2015'],
    },
  };
});