import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const BACKEND = `http://localhost:${env.BACKEND_PORT || 5000}`

  return {
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/vod':               { target: BACKEND, changeOrigin: true },
      '/series':            { target: BACKEND, changeOrigin: true },
      '/channels':          { target: BACKEND, changeOrigin: true },
      '/channel-categories':{ target: BACKEND, changeOrigin: true },
      '/proxy-stream':      { target: BACKEND, changeOrigin: true },
      '/stream-link':       { target: BACKEND, changeOrigin: true },
      '/favorites':         { target: BACKEND, changeOrigin: true },
      '/epg':               { target: BACKEND, changeOrigin: true },
      '/search':            { target: BACKEND, changeOrigin: true }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  esbuild: {
    target: 'es2020'
  }
  }
})
