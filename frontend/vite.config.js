import path from "node:path"
import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"


const currentDirectory = path.dirname(fileURLToPath(import.meta.url))


export default defineConfig({
  plugins:[react(), tailwindcss()],
  resolve:{
    alias:{
      "@":path.resolve(currentDirectory, "src"),
    },
  },
  server:{
    host:"0.0.0.0",
    port:3000,
    strictPort:true,
  },
  preview:{
    host:"0.0.0.0",
    port:3000,
    strictPort:true,
  },
  test:{
    environment:"jsdom",
    globals:true,
    setupFiles:"./src/tests/support/setup.js",
    css:true,
  },
})
