// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    exclude: [
      ...configDefaults.exclude, 
      'tests/e2e/*', // Exclude e2e tests if you have any
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**/*',
        'dist/**/*',
        "*.js", // Exclude all JavaScript files in the root directory
      ],
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.js'),
      name: 'webgpu_volume',
      fileName: (format) => `webgpu_volume.${format}.js`
    },
  },
  // Other Vite configuration options...
  server: {
    port: 5555, // Configures the development server to use port 3000
  },
  preview: {
    port: 5555, // Configures the preview server to use port 3000
  },
});
/*
module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'webgpu_volume',
      fileName: (format) => `webgpu_volume.${format}.js`
    }
  }
});
*/
