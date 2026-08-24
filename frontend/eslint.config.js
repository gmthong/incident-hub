import js from "@eslint/js"
import query from "@tanstack/eslint-plugin-query"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"


export default defineConfig([
  globalIgnores(["dist", "coverage", "node_modules"]),
  {
    files:["**/*.{js,jsx}"],
    extends:[
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      query.configs["flat/recommended"],
    ],
    languageOptions:{
      ecmaVersion:"latest",
      globals:{
        ...globals.browser,
        ...globals.node,
      },
      parserOptions:{
        ecmaFeatures:{jsx:true},
        sourceType:"module",
      },
    },
    rules:{
      "no-unused-vars":["error", {argsIgnorePattern:"^_", varsIgnorePattern:"^_"}],
    },
  },
  {
    files:["src/**/*.test.{js,jsx}", "src/test/**/*.{js,jsx}"],
    languageOptions:{
      globals:globals.vitest,
    },
  },
])
