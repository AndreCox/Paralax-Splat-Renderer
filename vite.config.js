// vite.config.js
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Set base to your repository name for GitHub Pages
  base: "/Paralax-Splat-Renderer/",

  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },

  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },

  build: {
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      output: {
        format: "es",
      },
    },
  },
});
