/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Config separada de vite.config.ts a proposito: asi el build de produccion (tsc -b && vite
// build) nunca depende de vitest, y vitest recoge este archivo automaticamente sin tocar la
// config de Vite que ya usa `dev`/`build`/`preview`.
//
// Importamos `defineConfig` desde 'vite' (no desde 'vitest/config') a proposito. Este proyecto
// usa vite@8.2.2 (el vite nuevo basado en Rolldown), pero el rango de peerDependency de vitest
// pide una version de Vite mas vieja, asi que pnpm instala una copia extra solo para satisfacer
// ese peer. Si `defineConfig` se importa desde 'vitest/config', TypeScript termina comparando el
// tipo `Plugin` de nuestro vite@8.2.2 contra el de esa copia duplicada y el build de `tsc -b`
// truena con un choque de tipos que no es un bug real, es el mismatch de versiones. La
// referencia triple-slash de abajo le agrega el campo `test` a la config de Vite (via
// declaration merging) sin arrastrar ese `Plugin` duplicado — es el workaround que la propia
// documentacion de Vitest recomienda para este caso.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
