import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 配置前端代理，解决跨域问题
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // 这里填你 Python 后端运行的真实地址和端口
        changeOrigin: true,
      }
    }
  }
})