import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        about:      resolve(__dirname, 'about.html'),
        docs:       resolve(__dirname, 'docs.html'),
        showcase:   resolve(__dirname, 'showcase.html'),
        changelog:  resolve(__dirname, 'changelog.html'),
        comparatif: resolve(__dirname, 'comparatif.html'),
        privacy:    resolve(__dirname, 'privacy.html'),
        blog:       resolve(__dirname, 'blog.html'),
        lf:         resolve(__dirname, 'logiciel-facturation-tunisie.html'),
        fe:         resolve(__dirname, 'facture-electronique-tunisie.html'),
        devis:      resolve(__dirname, 'devis-tunisie.html'),
        dtva:       resolve(__dirname, 'declaration-tva-tunisie.html'),
        caisse:     resolve(__dirname, 'logiciel-caisse-tunisie.html'),
        ctva:       resolve(__dirname, 'calculateur-tva-tunisie.html'),
        gc:         resolve(__dirname, 'logiciel-gestion-commerciale-tunisie.html'),
        fg:         resolve(__dirname, 'facture-gratuite-tunisie.html'),
      }
    }
  }
})
