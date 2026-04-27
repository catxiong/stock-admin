import {fileURLToPath, URL} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver({importStyle: 'sass'})],
      dirs: ['src/components'],
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5100,
    strictPort: false,
    open: false,
    proxy: {
      '/stock': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'utils': fileURLToPath(new URL('src/utils', import.meta.url)),
      'store': fileURLToPath(new URL('src/stores', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        javascriptEnabled: true,
        additionalData: `@use "@/assets/styles/main.scss" as *;`,
      },
    },
  },
})
