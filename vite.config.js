// based on https://andrewwalpole.com/blog/use-vite-for-javascript-libraries/

const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'webgpu_volume',
      fileName: (format) => `webgpu_volume.${format}.js`
    },
    minify: false
  }
});
