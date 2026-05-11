import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_DEV_API_PROXY?.trim() || 'http://localhost:1072'

  return {
    plugins: [react()],
    build: {
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/@mui/material/')) {
              return 'mui-core'
            }

            if (id.includes('/node_modules/@mui/icons-material/')) {
              return 'mui-icons'
            }
          },
        },
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5187,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
