import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // Never inline binary assets (GLB, images)
    chunkSizeWarningLimit: 1000, // Suppress warnings for Three.js chunks
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'], // Separate Three.js into its own chunk for caching
        },
      },
    },
  },
})
