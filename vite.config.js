import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:      resolve(__dirname, 'index.html'),
        about:     resolve(__dirname, 'about.html'),
        docs:      resolve(__dirname, 'docs.html'),
        showcase:  resolve(__dirname, 'showcase.html'),
        changelog: resolve(__dirname, 'changelog.html'),
        privacy:   resolve(__dirname, 'privacy.html'),
      }
    }
  }
})
