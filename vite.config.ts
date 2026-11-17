import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Caminho base para publicar no GitHub Pages (https://<usuario>.github.io/reharm/).
  // Troque quando o nome definitivo do repositório for escolhido.
  base: '/reharm/',
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})
