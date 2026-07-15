import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import fs from 'fs'

function copyWasmPlugin() {
  return {
    name: 'copy-wasm',
    closeBundle() {
      const src = path.resolve(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm')
      const dest = path.resolve(__dirname, 'dist-electron/main/sql-wasm.wasm')
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
        console.log('sql-wasm.wasm copied to dist-electron/main/')
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['sql.js', 'bcryptjs']
            },
            plugins: [copyWasmPlugin()]
          }
        }
      },
      {
        entry: 'src/main/preload.ts',
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload'
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  }
})
