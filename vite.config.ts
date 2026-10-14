import { fileURLToPath, URL } from 'node:url'

import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { IconsPluginCustom } from './vite.config.icons'
import { ComponentsBuilder } from './vite.config.components'
import { ImportsBuilder } from './vite.config.imports'
import { LegalPagesPlugin } from './vite.config.legal'

import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: true
    }),
    IconsPluginCustom(),
    ComponentsBuilder(),
    ImportsBuilder(),
    svgLoader(),
    // Статичні юридичні сторінки (/terms/, /offer/, … і /en/…) з legal/<lang>/*.md — поза SPA.
    LegalPagesPlugin()
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@colors': fileURLToPath(new URL('./tailwind/tailwind.colors.ts', import.meta.url))
    }
  },

  build: {
    // Стабільні вендорні бібліотеки — окремими чанками: після деплою браузер перекачує лише
    // код застосунку, а не весь бандл разом із Vue/Element Plus.
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](vue|@vue|vue-router|pinia|@pinia|@vueuse)[\\/]/.test(id)) return 'vendor-vue'
          if (/[\\/]node_modules[\\/](element-plus|@element-plus|@popperjs|@ctrl|async-validator|lodash-es|lodash-unified|memoize-one|normalize-wheel-es|@floating-ui)[\\/]/.test(id)) {
            return 'vendor-element-plus'
          }
          if (/[\\/]node_modules[\\/](socket\.io-client|engine\.io-client|socket\.io-parser|engine\.io-parser)[\\/]/.test(id)) {
            return 'vendor-socket'
          }
          return undefined
        }
      }
    },
    // Підрахунок gzip-розмірів у логах білду лише сповільнює CI.
    reportCompressedSize: false
  }
})
