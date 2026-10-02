import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

/* CONFIGURATION FOR SCRIPTS AUTO-IMPORT */
export const ImportsBuilder = () => AutoImport({
  dts: './dts/auto-imports.d.ts',

  dirs: [
    './src/composables',
    './src/composables/**/index.ts',
    './src/api/*client.ts',
    './src/store/modules',
    './src/services',
    './src/views/**/*.store.ts',
    './src/views/**/*.service.ts',
    './src/features/**/*.store.ts',
    './src/features/**/*.service.ts',
    './src/features/**/composables'
  ],

  eslintrc: {
    enabled: true
  },

  imports: [
    'vue',
    'vue-router',
    '@vueuse/core',
    '@vueuse/head',
    'pinia'
  ],
  resolvers: [ElementPlusResolver()]
})
