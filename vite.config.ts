import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      plugins: [polyfillNode({})]
    }
  },
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {}
  }
})
