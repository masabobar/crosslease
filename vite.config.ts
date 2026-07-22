import { defineConfig, loadEnv } from "vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Set API_PROXY_TARGET to develop locally against a remote API (e.g. the
    // dev environment) without hitting SameSite=Lax cookie rejection: proxying
    // through the Vite dev server makes every request same-origin from the
    // browser's perspective, so the auth cookie is stored and sent normally.
    server: env.API_PROXY_TARGET
      ? {
          proxy: {
            "/api": {
              target: env.API_PROXY_TARGET,
              changeOrigin: true,
            },
          },
        }
      : undefined,
  }
})
